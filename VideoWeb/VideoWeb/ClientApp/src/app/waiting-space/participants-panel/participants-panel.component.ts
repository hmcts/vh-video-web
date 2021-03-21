import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { ParticipantResponse } from 'src/app/services/clients/api-client';
import { EventsService } from 'src/app/services/events.service';
import { Logger } from 'src/app/services/logging/logger-base';
import { EndpointStatusMessage } from 'src/app/services/models/EndpointStatusMessage';
import { HearingTransfer, TransferDirection } from 'src/app/services/models/hearing-transfer';
import { ParticipantStatusMessage } from 'src/app/services/models/participant-status-message';
import { ParticipantPanelModelMapper } from 'src/app/shared/mappers/participant-panel-model-mapper';
import {
    CallWitnessIntoHearingEvent,
    DismissWitnessFromHearingEvent,
    LowerParticipantHandEvent,
    ToggleMuteParticipantEvent,
    ToggleSpotlightParticipantEvent
} from 'src/app/shared/models/participant-event';
import { ParticipantHandRaisedMessage } from 'src/app/shared/models/participant-hand-raised-message';
import { ParticipantMediaStatusMessage } from 'src/app/shared/models/participant-media-status-message';
import { CaseTypeGroup } from '../models/case-type-group';
import { HearingRole } from '../models/hearing-role-model';
import { LinkedParticipantPanelModel } from '../models/linked-participant-panel-model';
import { PanelModel } from '../models/panel-model-base';
import { ParticipantPanelModel } from '../models/participant-panel-model';
import { ConferenceUpdated, ParticipantUpdated } from '../models/video-call-models';
import { VideoEndpointPanelModel } from '../models/video-endpoint-panel-model';
import { VideoCallService } from '../services/video-call.service';

@Component({
    selector: 'app-participants-panel',
    templateUrl: './participants-panel.component.html',
    styleUrls: ['./participants-panel.component.scss']
})
export class ParticipantsPanelComponent implements OnInit, OnDestroy {
    private readonly loggerPrefix = '[ParticipantsPanel] -';
    participants: PanelModel[] = [];
    isMuteAll = false;
    conferenceId: string;

    videoCallSubscription$ = new Subscription();
    eventhubSubscription$ = new Subscription();

    witnessTransferTimeout: { [id: string]: NodeJS.Timeout } = {};

    constructor(
        private videoWebService: VideoWebService,
        private route: ActivatedRoute,
        private videoCallService: VideoCallService,
        private eventService: EventsService,
        private logger: Logger,
        protected translateService: TranslateService
    ) {}

    ngOnInit() {
        this.conferenceId = this.route.snapshot.paramMap.get('conferenceId');
        this.getParticipantsList().then(() => {
            this.setupVideoCallSubscribers();
            this.setupEventhubSubscribers();
        });
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

        this.eventhubSubscription$.add(
            this.eventService.getParticipantHandRaisedMessage().subscribe(async message => {
                this.handleParticipantHandRaiseChange(message);
            })
        );
    }
    handleParticipantHandRaiseChange(message: ParticipantHandRaisedMessage) {
        const participant = this.participants.find(x => x.hasParticipant(message.participantId));
        if (!participant) {
            return;
        }
        this.logger.debug(`${this.loggerPrefix} Participant hand raised status has been updated`, {
            conference: this.conferenceId,
            participant: participant.id,
            handRaised: message.handRaised
        });
        participant.updateParticipant(participant.isMicRemoteMuted(), message.handRaised, participant.hasSpotlight());
    }

    handleParticipantMediaStatusChange(message: ParticipantMediaStatusMessage) {
        const participant = this.participants.find(x => x.hasParticipant(message.participantId));
        if (!participant) {
            return;
        }
        this.logger.debug(`${this.loggerPrefix} Participant device status has been updated`, {
            conference: this.conferenceId,
            participant: participant.id,
            mediaStatus: message.mediaStatus
        });
        participant.updateParticipantDeviceStatus(
            message.mediaStatus.is_local_audio_muted,
            message.mediaStatus.is_local_video_muted,
            message.participantId
        );
    }

    handleHearingTransferChange(message: HearingTransfer) {
        const participant = this.participants.find(x => x.hasParticipant(message.participantId));
        if (!participant) {
            return;
        }
        this.logger.debug(`${this.loggerPrefix} Participant status has been updated`, {
            conference: this.conferenceId,
            participant: participant.id,
            transferDirection: message.transferDirection
        });
        participant.updateTransferringInStatus(message.transferDirection === TransferDirection.In, message.participantId);
    }

    handleUpdatedConferenceVideoCall(updatedConference: ConferenceUpdated): void {
        this.logger.debug(`${this.loggerPrefix} Conference has been muted`, {
            conference: this.conferenceId,
            guestedMuted: updatedConference.guestedMuted
        });
        this.isMuteAll = updatedConference.guestedMuted;
    }

    handleParticipantUpdatedInVideoCall(updatedParticipant: ParticipantUpdated): void {
        const participant = this.participants.find(x => updatedParticipant.pexipDisplayName.includes(x.id));
        if (!participant) {
            return;
        }

        participant.assignPexipId(updatedParticipant.uuid);
        participant.updateParticipant(updatedParticipant.isRemoteMuted, updatedParticipant.handRaised, updatedParticipant.isSpotlighted);
        if (participant instanceof LinkedParticipantPanelModel) {
            (<LinkedParticipantPanelModel>participant).participants.forEach(async p => {
                await this.eventService.publishRemoteMuteStatus(this.conferenceId, p.id, updatedParticipant.isRemoteMuted);
            });
        }
        this.logger.debug(`${this.loggerPrefix} Participant has been updated in video call`, {
            conference: this.conferenceId,
            participant: participant.id,
            pexipParticipant: participant.pexipId,
            isRemoteMuted: participant.isMicRemoteMuted(),
            handRaised: participant.hasHandRaised(),
            isSpotlighted: participant.hasSpotlight()
        });
    }

    handleParticipantStatusChange(message: ParticipantStatusMessage): void {
        const participant = this.participants.find(x => x.hasParticipant(message.participantId));
        if (!participant) {
            return;
        }
        this.logger.debug(`${this.loggerPrefix} Participant status has been updated`, {
            conference: this.conferenceId,
            participant: participant.id,
            status: message.status
        });
        participant.updateStatus(message.status, message.participantId);
        participant.updateTransferringInStatus(false, message.participantId);
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
        endpoint.updateStatus(message.status);
    }

    async getParticipantsList() {
        try {
            const pats = await this.videoWebService.getParticipantsByConferenceId(this.conferenceId);
            const eps = this.videoWebService.getEndpointsForConference(this.conferenceId);

            this.participants = this.participants.concat(new ParticipantPanelModelMapper().mapFromParticipantUserResponse(pats));

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

    muteAndLockAll() {
        this.logger.debug(`${this.loggerPrefix} Judge is attempting to mute all`, {
            conference: this.conferenceId,
            current: this.isMuteAll,
            new: true
        });
        this.videoCallService.muteAllParticipants(true, this.conferenceId);
    }

    unlockAll() {
        this.logger.debug(`${this.loggerPrefix} Judge is attempting to unmute all`, {
            conference: this.conferenceId,
            current: this.isMuteAll,
            new: false
        });
        this.videoCallService.muteAllParticipants(false, this.conferenceId);
    }

    toggleSpotlightParticipant(participant: PanelModel) {
        const p = this.participants.find(x => x.id === participant.id);
        this.logger.debug(`${this.loggerPrefix} Judge is attempting to toggle spotlight for participant`, {
            conference: this.conferenceId,
            participant: p.id,
            pexipParticipant: p.pexipId,
            current: p.hasSpotlight(),
            new: !p.hasSpotlight()
        });
        this.videoCallService.spotlightParticipant(p.pexipId, !p.hasSpotlight(), this.conferenceId, p.id);
    }

    toggleMuteParticipant(participant: PanelModel) {
        const hearingParticipants = this.participants.filter(x => x.isInHearing());
        const mutedParticipants = hearingParticipants.filter(x => x.isMicRemoteMuted());
        const p = this.participants.find(x => x.id === participant.id);

        const newMuteStatus = !p.isMicRemoteMuted();
        this.logger.debug(`${this.loggerPrefix} Judge is attempting to toggle mute for participant`, {
            conference: this.conferenceId,
            participant: p.id,
            pexipParticipant: p.pexipId,
            current: p.isMicRemoteMuted(),
            new: newMuteStatus
        });
        this.videoCallService.muteParticipant(p.pexipId, newMuteStatus, this.conferenceId, p.id);
        if (mutedParticipants.length === 1 && this.isMuteAll) {
            // check if last person to be unmuted manually
            this.logger.debug(`${this.loggerPrefix} Judge has manually unmuted the last muted participant. Unmuting conference`, {
                conference: this.conferenceId
            });
            this.videoCallService.muteAllParticipants(false, this.conferenceId);
        }

        // mute conference if last person manually muted
        if (mutedParticipants.length === hearingParticipants.length - 1 && !p.isMicRemoteMuted()) {
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
        this.participants
            .filter(x => x instanceof LinkedParticipantPanelModel)
            .forEach(async lp => {
                this.lowerLinkedParticipantHand(lp as LinkedParticipantPanelModel);
            });
    }

    lowerParticipantHand(participant: PanelModel) {
        const p = this.participants.find(x => x.id === participant.id);
        this.logger.debug(`${this.loggerPrefix} Judge is attempting to lower hand for participant`, {
            conference: this.conferenceId,
            participant: p.id,
            pexipParticipant: p.pexipId
        });
        this.videoCallService.lowerHandById(p.pexipId, this.conferenceId, p.id);
        if (p instanceof LinkedParticipantPanelModel) {
            this.lowerLinkedParticipantHand(p);
        }
    }

    lowerLinkedParticipantHand(linkedParticipant: LinkedParticipantPanelModel) {
        linkedParticipant.participants.forEach(async p => {
            await this.eventService.publishParticipantHandRaisedStatus(this.conferenceId, p.id, false);
        });
    }

    async callWitnessIntoHearing(participant: PanelModel) {
        if (!participant.isAvailable() || !participant.isWitness) {
            return;
        }
        this.logger.debug(`${this.loggerPrefix} Judge is attempting to call witness into hearing`, {
            conference: this.conferenceId,
            participant: participant.id
        });

        await this.sendTransferDirection(participant, TransferDirection.In);
        this.witnessTransferTimeout[participant.id] = setTimeout(() => {
            this.initiateTransfer(participant);
        }, 10000);
    }

    private async sendTransferDirection(participant: PanelModel, direction: TransferDirection) {
        if (participant instanceof LinkedParticipantPanelModel) {
            const linkedParticipants = participant as LinkedParticipantPanelModel;
            linkedParticipants.participants.forEach(async p => {
                await this.eventService.sendTransferRequest(this.conferenceId, p.id, direction);
            });
        } else {
            await this.eventService.sendTransferRequest(this.conferenceId, participant.id, direction);
        }
    }

    async initiateTransfer(participant: PanelModel) {
        try {
            this.resetWitnessTransferTimeout(participant.id);
            let participantId = participant.id;
            if (participant instanceof LinkedParticipantPanelModel) {
                participantId = participant.witnessParticipant.id;
            }
            await this.videoCallService.callParticipantIntoHearing(this.conferenceId, participantId);
            this.logger.debug(`${this.loggerPrefix} 10 second wait completed, initiating witneses transfer now`, {
                witness: participant.id,
                conference: this.conferenceId
            });
        } catch (error) {
            participant.updateTransferringInStatus(false);
            await this.sendTransferDirection(participant, TransferDirection.Out);
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

        participant.dimissed();

        try {
            let participantId = participant.id;
            if (participant instanceof LinkedParticipantPanelModel) {
                participantId = participant.witnessParticipant.id;
            }
            await this.videoCallService.dismissParticipantFromHearing(this.conferenceId, participantId);
        } catch (error) {
            this.logger.error(`${this.loggerPrefix} Failed to raise request to dismiss witness out of hearing`, error, {
                witness: participant.id,
                conference: this.conferenceId
            });
        }
    }

    isEndpoint(participant: PanelModel) {
        return participant instanceof VideoEndpointPanelModel;
    }

    isLinkedParticipant(participant: PanelModel) {
        return participant instanceof LinkedParticipantPanelModel;
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
            return participant.displayName + ': ' + this.getTranslatedText('joining') + this.getAdditionalText(participant);
        }
        if (!participant.isDisconnected() && !participant.isInHearing()) {
            return participant.displayName + ': ' + this.getTranslatedText('not-joined') + this.getAdditionalText(participant);
        }
        if (participant.isDisconnected()) {
            return participant.displayName + ': ' + this.getTranslatedText('disconnected') + this.getAdditionalText(participant);
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

    getTranslatedText(key: string): string {
        return this.translateService.instant(`participants-panel.${key}`);
    }

    private getHearingRole(participant: PanelModel): string {
        const translatedtext = this.getTranslatedText('for');
        const hearingRoleText = this.translateService.instant('hearing-role.' + participant.hearingRole.toLowerCase().split(' ').join('-'));
        return participant.representee ? `<br/>${hearingRoleText} ${translatedtext} ${participant.representee}` : `<br/>${hearingRoleText}`;
    }

    private getCaseRole(participant: PanelModel): string {
        const translatedCaseTypeGroup = this.translateService.instant(
            'case-type-group.' + participant.caseTypeGroup.toLowerCase().split(' ').join('-')
        );
        return this.showCaseRole(participant) ? `<br/>${translatedCaseTypeGroup}` : '';
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
