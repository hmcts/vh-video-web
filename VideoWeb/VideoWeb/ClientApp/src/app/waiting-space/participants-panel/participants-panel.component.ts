import { AfterViewInit, Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { ParticipantResponse } from 'src/app/services/clients/api-client';
import { EventsService } from 'src/app/services/events.service';
import { Logger } from 'src/app/services/logging/logger-base';
import { EndpointStatusMessage } from 'src/app/services/models/EndpointStatusMessage';
import { ParticipantStatusMessage } from 'src/app/services/models/participant-status-message';
import { CaseTypeGroup } from '../models/case-type-group';
import { HearingRole } from '../models/hearing-role-model';
import { PanelModel, ParticipantPanelModel, VideoEndpointPanelModel } from '../models/participant-panel-model';
import { ConferenceUpdated, ParticipantUpdated } from '../models/video-call-models';
import { VideoCallService } from '../services/video-call.service';
import {
    ToggleMuteParticipantEvent,
    ToggleSpotlightParticipantEvent,
    LowerParticipantHandEvent,
    CallWitnessIntoHearingEvent,
    DismissWitnessFromHearingEvent
} from 'src/app/shared/models/participant-event';
import { HearingTransfer, TransferDirection } from 'src/app/services/models/hearing-transfer';
import { ParticipantMediaStatusMessage } from 'src/app/shared/models/participant-media-status-message';

@Component({
    selector: 'app-participants-panel',
    templateUrl: './participants-panel.component.html',
    styleUrls: ['./participants-panel.component.scss']
})
export class ParticipantsPanelComponent implements OnInit, AfterViewInit, OnDestroy {
    private readonly loggerPrefix = '[ParticipantsPanel] -';
    participants: PanelModel[] = [];
    isMuteAll = false;
    conferenceId: string;

    videoCallSubscription$ = new Subscription();
    eventhubSubscription$ = new Subscription();

    firstElement: HTMLElement;
    lastElement: HTMLElement;

    isScrolling = 0;
    witnessTransferTimeout: { [id: string]: NodeJS.Timeout } = {};

    constructor(
        private videoWebService: VideoWebService,
        private route: ActivatedRoute,
        private videoCallService: VideoCallService,
        private eventService: EventsService,
        private logger: Logger
    ) {}

    get muteAllToggleText() {
        if (this.isMuteAll) {
            return 'Unmute all';
        } else {
            return 'Mute all';
        }
    }

    ngOnInit() {
        this.conferenceId = this.route.snapshot.paramMap.get('conferenceId');
        this.getParticipantsList().then(() => {
            this.setupVideoCallSubscribers();
            this.setupEventhubSubscribers();
        });
    }

    ngAfterViewInit() {
        setTimeout(() => this.initializeScrolling(), 1000);
    }

    toggleMuteParticipantEventHandler(e: ToggleMuteParticipantEvent) {
        this.toggleMuteParticipant(e.participant);
    }

    toggleSpotlightParticipantEventHandler(e: ToggleSpotlightParticipantEvent) {
        this.toggleSpotlightParticipant(e.participant);
    }

    lowerParticipantHandEventHandler(e: LowerParticipantHandEvent) {
        this.lowerParticipantHand(e.participant);
    }

    callWitnessIntoHearingEventHandler(e: CallWitnessIntoHearingEvent) {
        this.callWitnessIntoHearing(e.participant);
    }

    dismissWitnessFromHearingEventHandler(e: DismissWitnessFromHearingEvent) {
        this.dismissWitnessFromHearing(e.participant);
    }

    initializeScrolling() {
        this.firstElement = document.querySelector('#panel_participant_0');
        this.lastElement = document.querySelector('#panel_participant_' + (this.participants.length - 1));
        this.setScrollingIndicator();
    }

    ngOnDestroy(): void {
        this.videoCallSubscription$.unsubscribe();
        this.eventhubSubscription$.unsubscribe();
        this.resetAllWitnessTransferTimeouts();
    }

    resetWitnessTransferTimeout(participantId: string) {
        clearTimeout(this.witnessTransferTimeout[participantId]);
        this.witnessTransferTimeout[participantId] = undefined;
    }

    resetAllWitnessTransferTimeouts() {
        for (const participantId of Object.keys(this.witnessTransferTimeout)) {
            this.resetWitnessTransferTimeout(participantId);
        }
    }

    setupVideoCallSubscribers() {
        this.logger.debug(`${this.loggerPrefix} Setting up pexip video call subscribers`);
        this.videoCallSubscription$.add(
            this.videoCallService
                .onParticipantUpdated()
                .subscribe(updatedParticipant => this.handleParticipantUpdatedInVideoCall(updatedParticipant))
        );

        this.videoCallSubscription$.add(
            this.videoCallService
                .onConferenceUpdated()
                .subscribe(updatedConference => this.handleUpdatedConferenceVideoCall(updatedConference))
        );
    }

    setupEventhubSubscribers() {
        this.logger.debug(`${this.loggerPrefix} Setting up EventHub subscribers`);
        this.eventhubSubscription$.add(
            this.eventService.getParticipantStatusMessage().subscribe(message => {
                this.handleParticipantStatusChange(message);
            })
        );

        this.eventhubSubscription$.add(
            this.eventService.getEndpointStatusMessage().subscribe(message => {
                this.handleEndpointStatusChange(message);
            })
        );

        this.eventhubSubscription$.add(
            this.eventService.getHearingTransfer().subscribe(async message => {
                this.handleHearingTransferChange(message);
            })
        );

        this.eventhubSubscription$.add(
            this.eventService.getParticipantMediaStatusMessage().subscribe(async message => {
                this.handleParticipantMediaStatusChange(message);
            })
        );
    }
    handleParticipantMediaStatusChange(message: ParticipantMediaStatusMessage) {
        const participant = this.participants.find(x => x.id === message.participantId);
        if (!participant) {
            return;
        }
        this.logger.debug(`${this.loggerPrefix} Participant device status has been updated`, {
            conference: this.conferenceId,
            participant: participant.id,
            mediaStatus: message.mediaStatus
        });
        participant.isLocalAudioMuted = message.mediaStatus.is_local_audio_muted;
    }

    handleHearingTransferChange(message: HearingTransfer) {
        const participant = this.participants.find(x => x.id === message.participantId);
        if (!participant) {
            return;
        }
        this.logger.debug(`${this.loggerPrefix} Participant status has been updated`, {
            conference: this.conferenceId,
            participant: participant.id,
            transferDirection: message.transferDirection
        });
        participant.transferringIn = message.transferDirection === TransferDirection.In;
    }

    handleUpdatedConferenceVideoCall(updatedConference: ConferenceUpdated): void {
        this.logger.debug(`${this.loggerPrefix} Conference has been muted`, {
            conference: this.conferenceId,
            guestedMuted: updatedConference.guestedMuted
        });
        this.isMuteAll = updatedConference.guestedMuted;
    }

    handleParticipantUpdatedInVideoCall(updatedParticipant: ParticipantUpdated): boolean {
        const participant = this.participants.find(x => updatedParticipant.pexipDisplayName.includes(x.id));
        if (!participant) {
            return;
        }
        participant.pexipId = updatedParticipant.uuid;
        participant.isRemoteMuted = updatedParticipant.isRemoteMuted;
        participant.handRaised = updatedParticipant.handRaised;
        participant.isSpotlighted = updatedParticipant.isSpotlighted;
        this.logger.debug(`${this.loggerPrefix} Participant has been updated in video call`, {
            conference: this.conferenceId,
            participant: participant.id,
            pexipParticipant: participant.pexipId,
            isRemoteMuted: participant.isRemoteMuted,
            handRaised: participant.handRaised,
            isSpotlighted: participant.isSpotlighted
        });
    }

    handleParticipantStatusChange(message: ParticipantStatusMessage): void {
        const participant = this.participants.find(x => x.id === message.participantId);
        if (!participant) {
            return;
        }
        this.logger.debug(`${this.loggerPrefix} Participant status has been updated`, {
            conference: this.conferenceId,
            participant: participant.id,
            status: message.status
        });
        (<ParticipantPanelModel>participant).status = message.status;
        participant.transferringIn = false;
    }

    handleEndpointStatusChange(message: EndpointStatusMessage) {
        const endpoint = this.participants.find(x => x.id === message.endpointId);
        if (!endpoint) {
            return;
        }
        this.logger.debug(`${this.loggerPrefix} Endpoint status has been updated`, {
            conference: this.conferenceId,
            endpoint: endpoint.id,
            status: message.status
        });
        (<VideoEndpointPanelModel>endpoint).status = message.status;
    }

    async getParticipantsList() {
        try {
            const pats = this.videoWebService.getParticipantsByConferenceId(this.conferenceId);
            const eps = this.videoWebService.getEndpointsForConference(this.conferenceId);

            (await pats).forEach(x => {
                const participant = new ParticipantPanelModel(x);
                this.participants.push(participant);
            });
            this.logger.debug(`${this.loggerPrefix} Retrieved participants in conference`, { conference: this.conferenceId });

            (await eps).forEach(x => {
                const endpoint = new VideoEndpointPanelModel(x);
                this.participants.push(endpoint);
            });
            this.logger.debug(`${this.loggerPrefix} Retrieved endpoints in conference`, { conference: this.conferenceId });
            this.participants.sort((x, z) => {
                return x.orderInTheList === z.orderInTheList ? 0 : +(x.orderInTheList > z.orderInTheList) || -1;
            });
        } catch (err) {
            this.logger.error(`${this.loggerPrefix} Failed to get participants / endpoints`, err, { conference: this.conferenceId });
        }
    }

    isParticipantInHearing(participant: PanelModel): boolean {
        return participant.isInHearing();
    }

    toggleMuteAll() {
        this.logger.debug(`${this.loggerPrefix} Judge is attempting to toggle mute all status`, {
            conference: this.conferenceId,
            current: this.isMuteAll,
            new: !this.isMuteAll
        });
        this.videoCallService.muteAllParticipants(!this.isMuteAll, this.conferenceId);
    }

    toggleSpotlightParticipant(participant: PanelModel) {
        const p = this.participants.find(x => x.id === participant.id);
        this.logger.debug(`${this.loggerPrefix} Judge is attempting to toggle spotlight for participant`, {
            conference: this.conferenceId,
            participant: p.id,
            pexipParticipant: p.pexipId,
            current: p.isSpotlighted,
            new: !p.isSpotlighted
        });
        this.videoCallService.spotlightParticipant(p.pexipId, !p.isSpotlighted, this.conferenceId, p.id);
    }

    toggleMuteParticipant(participant: PanelModel) {
        const hearingParticipants = this.participants.filter(x => x.isInHearing());
        const mutedParticipants = hearingParticipants.filter(x => x.isRemoteMuted);
        const p = this.participants.find(x => x.id === participant.id);

        this.logger.debug(`${this.loggerPrefix} Judge is attempting to toggle mute for participant`, {
            conference: this.conferenceId,
            participant: p.id,
            pexipParticipant: p.pexipId,
            current: p.isRemoteMuted,
            new: !p.isRemoteMuted
        });
        this.videoCallService.muteParticipant(p.pexipId, !p.isRemoteMuted, this.conferenceId, p.id);

        // check if last person to be unmuted manually
        if (mutedParticipants.length === 1 && this.isMuteAll) {
            this.logger.debug(`${this.loggerPrefix} Judge has manually unmuted the last muted participant. Unmuting conference`, {
                conference: this.conferenceId
            });
            this.videoCallService.muteAllParticipants(false, this.conferenceId);
        }

        // mute conference if last person manually muted
        if (mutedParticipants.length === hearingParticipants.length - 1 && !p.isRemoteMuted) {
            this.logger.debug(`${this.loggerPrefix} Judge has manually muted the last unmuted participant. Muting conference`, {
                conference: this.conferenceId
            });
            this.videoCallService.muteAllParticipants(true, this.conferenceId);
        }
    }

    lowerAllHands() {
        this.logger.debug(`${this.loggerPrefix} Judge is attempting to lower all hands in conference`, {
            conference: this.conferenceId
        });
        this.videoCallService.lowerAllHands(this.conferenceId);
    }

    lowerParticipantHand(participant: PanelModel) {
        const p = this.participants.find(x => x.id === participant.id);
        this.logger.debug(`${this.loggerPrefix} Judge is attempting to lower hand for participant`, {
            conference: this.conferenceId,
            participant: p.id,
            pexipParticipant: p.pexipId
        });
        this.videoCallService.lowerHandById(p.pexipId, this.conferenceId, p.id);
    }

    async callWitnessIntoHearing(participant: PanelModel) {
        if (!participant.isAvailable() || !participant.isWitness) {
            return;
        }
        this.logger.debug(`${this.loggerPrefix} Judge is attempting to call witness into hearing`, {
            conference: this.conferenceId,
            participant: participant.id
        });
        await this.eventService.sendTransferRequest(this.conferenceId, participant.id, TransferDirection.In);
        this.witnessTransferTimeout[participant.id] = setTimeout(() => {
            this.initiateTransfer(participant);
        }, 10000);
    }

    async initiateTransfer(participant: PanelModel) {
        try {
            this.resetWitnessTransferTimeout(participant.id);
            await this.videoCallService.callParticipantIntoHearing(this.conferenceId, participant.id);
            this.logger.debug(`${this.loggerPrefix} 10 second wait completed, initiating witneses transfer now`, {
                witness: participant.id,
                conference: this.conferenceId
            });
        } catch (error) {
            participant.transferringIn = false;
            this.logger.error(`${this.loggerPrefix} Failed to raise request to call witness into hearing`, error, {
                witness: participant.id,
                conference: this.conferenceId
            });
        }
    }

    async dismissWitnessFromHearing(participant: PanelModel) {
        if (!participant.isInHearing() || !participant.isWitness) {
            return;
        }

        this.logger.debug(`${this.loggerPrefix} Judge is attempting to dismiss witness from hearing`, {
            conference: this.conferenceId,
            participant: participant.id
        });

        participant.handRaised = false;
        participant.isSpotlighted = false;

        try {
            await this.videoCallService.dismissParticipantFromHearing(this.conferenceId, participant.id);
        } catch (error) {
            this.logger.error(`${this.loggerPrefix} Failed to raise request to dismiss witness out of hearing`, error, {
                witness: participant.id,
                conference: this.conferenceId
            });
        }
    }

    onScroll() {
        this.setScrollingIndicator();
    }

    scrollUp() {
        this.firstElement.scrollIntoView();
    }

    scrollDown() {
        this.lastElement.scrollIntoView();
    }

    isItemOfListVisible(element: HTMLElement) {
        if (element) {
            const position = element.getBoundingClientRect();

            // return true if element is fully visiable in screen
            return position.top >= 0 && position.bottom <= window.innerHeight;
        }

        return false;
    }

    setScrollingIndicator() {
        if (this.isItemOfListVisible(this.lastElement) && this.isItemOfListVisible(this.firstElement)) {
            this.isScrolling = 0; // no scrolling
        } else if (this.isItemOfListVisible(this.firstElement)) {
            this.isScrolling = 1; // scrolling to bottom
        } else {
            this.isScrolling = 2; // scrolling to top
        }
    }

    isEndpoint(participant: PanelModel) {
        return participant instanceof VideoEndpointPanelModel;
    }

    mapParticipantToParticipantResponse(participant: ParticipantPanelModel): ParticipantResponse {
        const participantResponse = new ParticipantResponse();
        participantResponse.id = participant.id;
        participantResponse.status = participant.status;
        participantResponse.display_name = participant.displayName;
        participantResponse.role = participant.role;
        participantResponse.case_type_group = participant.caseTypeGroup;
        participantResponse.hearing_role = participant.hearingRole;
        participantResponse.representee = participant.representee;
        return participantResponse;
    }

    isParticipantDisconnected(participant: PanelModel): boolean {
        return participant.isDisconnected();
    }

    getPanelRowTooltipText(participant: PanelModel) {
        if (participant.isAvailable()) {
            return participant.displayName + ': Joining' + this.getAdditionalText(participant);
        }
        if (!participant.isDisconnected() && !participant.isInHearing()) {
            return participant.displayName + ': Not joined' + this.getAdditionalText(participant);
        }
        if (participant.isDisconnected()) {
            return participant.displayName + ': DISCONNECTED' + this.getAdditionalText(participant);
        }
        return participant.displayName + this.getAdditionalText(participant);
    }

    getAdditionalText(participant: PanelModel): string {
        return participant.hearingRole !== HearingRole.JUDGE ? this.getHearingRole(participant) + this.getCaseRole(participant) : '';
    }

    getPanelRowTooltipColour(participant: PanelModel) {
        if (participant.isDisconnected()) {
            return 'red';
        } else if (participant.isAvailable() || participant.isInHearing()) {
            return 'blue';
        } else {
            return 'grey';
        }
    }

    private getHearingRole(participant: PanelModel): string {
        return participant.representee
            ? `<br/>${participant.hearingRole} for ${participant.representee}`
            : `<br/>${participant.hearingRole}`;
    }

    private getCaseRole(participant: PanelModel): string {
        return this.showCaseRole(participant) ? `<br/>${participant.caseTypeGroup}` : '';
    }

    private showCaseRole(participant: PanelModel) {
        return participant.caseTypeGroup.toLowerCase() === CaseTypeGroup.NONE.toLowerCase() ||
            participant.caseTypeGroup.toLowerCase() === CaseTypeGroup.OBSERVER.toLowerCase() ||
            participant.caseTypeGroup.toLowerCase() === CaseTypeGroup.PANEL_MEMBER.toLowerCase() ||
            participant.caseTypeGroup.toLowerCase() === CaseTypeGroup.JUDGE.toLowerCase() ||
            participant.caseTypeGroup.toLowerCase() === 'endpoint'
            ? false
            : true;
    }
}
