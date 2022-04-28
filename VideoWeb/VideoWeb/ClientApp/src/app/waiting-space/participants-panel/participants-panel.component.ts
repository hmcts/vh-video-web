import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { take } from 'rxjs/operators';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { ParticipantResponse, Role } from 'src/app/services/clients/api-client';
import { VideoControlService } from 'src/app/services/conference/video-control.service';
import { EventsService } from 'src/app/services/events.service';
import { Logger } from 'src/app/services/logging/logger-base';
import { EndpointStatusMessage } from 'src/app/services/models/EndpointStatusMessage';
import { HearingTransfer, TransferDirection } from 'src/app/services/models/hearing-transfer';
import { ParticipantStatusMessage } from 'src/app/services/models/participant-status-message';
import { ParticipantPanelModelMapper } from 'src/app/shared/mappers/participant-panel-model-mapper';
import {
    CallParticipantIntoHearingEvent,
    DismissParticipantFromHearingEvent,
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
import { ParticipantRemoteMuteStoreService } from '../services/participant-remote-mute-store.service';
import { VideoCallService } from '../services/video-call.service';
import { IndividualPanelModel } from '../models/individual-panel-model';

@Component({
    selector: 'app-participants-panel',
    templateUrl: './participants-panel.component.html',
    styleUrls: ['./participants-panel.component.scss']
})
export class ParticipantsPanelComponent implements OnInit, OnDestroy {
    constructor(
        private videoWebService: VideoWebService,
        private route: ActivatedRoute,
        private videoCallService: VideoCallService,
        private videoControlService: VideoControlService,
        private eventService: EventsService,
        private logger: Logger,
        private translateService: TranslateService,
        private mapper: ParticipantPanelModelMapper,
        private participantRemoteMuteStoreService: ParticipantRemoteMuteStoreService
    ) {}
    private readonly loggerPrefix = '[ParticipantsPanel] -';
    participants: PanelModel[] = [];
    nonEndpointParticipants: PanelModel[] = [];
    endpointParticipants: PanelModel[] = [];
    isMuteAll = false;
    conferenceId: string;
    readonly idPrefix = 'participants-panel';

    videoCallSubscription$ = new Subscription();
    eventhubSubscription$ = new Subscription();
    participantsSubscription$ = new Subscription();

    transferTimeout: { [id: string]: NodeJS.Timeout } = {};
    @Input() isCountdownCompleted: boolean;

    private static showCaseRole(participant: PanelModel) {
        return !(
            participant.caseTypeGroup.toLowerCase() === CaseTypeGroup.NONE.toLowerCase() ||
            participant.caseTypeGroup.toLowerCase() === CaseTypeGroup.OBSERVER.toLowerCase() ||
            participant.caseTypeGroup.toLowerCase() === CaseTypeGroup.JUDGE.toLowerCase() ||
            participant.caseTypeGroup.toLowerCase() === 'endpoint'
        );
    }

    private static updateParticipant(participant: PanelModel, participantToBeUpdated: PanelModel) {
        participant.updateParticipant(
            participantToBeUpdated?.isMicRemoteMuted(),
            participantToBeUpdated?.hasHandRaised(),
            participantToBeUpdated?.hasSpotlight(),
            participantToBeUpdated?.id,
            participantToBeUpdated?.isLocalMicMuted(),
            participantToBeUpdated?.isLocalCameraOff()
        );
        participant.assignPexipId(participantToBeUpdated?.pexipId);
    }

    ngOnInit() {
        this.conferenceId = this.route.snapshot.paramMap.get('conferenceId');
        this.getParticipantsList().then(() => {
            this.participantRemoteMuteStoreService.conferenceParticipantsStatus$.pipe(take(1)).subscribe(state => {
                this.participants.forEach(participant => {
                    if (state.hasOwnProperty(participant.id)) {
                        this.logger.debug(`${this.loggerPrefix} restoring pexip ID`, {
                            participantId: participant.id,
                            pexipId: state[participant.id].pexipId,
                            state: state
                        });
                        if (state[participant.id].pexipId) {
                            participant.assignPexipId(state[participant.id].pexipId);
                        }
                    }
                    participant.updateParticipant(
                        state[participant.id]?.isRemoteMuted,
                        false,
                        participant.hasSpotlight(),
                        participant.id,
                        state[participant.id]?.isLocalAudioMuted,
                        state[participant.id]?.isLocalVideoMuted
                    );
                });
            });
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

    callParticipantIntoHearingEventHandler(e: CallParticipantIntoHearingEvent) {
        this.callParticipantIntoHearing(e.participant);
    }

    dismissParticipantFromHearingEventHandler(e: DismissParticipantFromHearingEvent) {
        this.dismissParticipantFromHearing(e.participant);
    }

    ngOnDestroy(): void {
        this.videoCallSubscription$.unsubscribe();
        this.eventhubSubscription$.unsubscribe();
        this.participantsSubscription$.unsubscribe();
        this.resetAllWitnessTransferTimeouts();
    }

    updateLocalAudioMutedForWitnessInterpreterVmr(
        linkedParticipant: IndividualPanelModel,
        participantId: string,
        localAudioMuted: boolean
    ) {
        this.logger.info(`${this.loggerPrefix} Setting store audio muted to true`, {
            linkedParticipantId: linkedParticipant.id,
            participantId: participantId,
            localAudioMuted: localAudioMuted
        });

        this.participantRemoteMuteStoreService.updateLocalMuteStatus(linkedParticipant.id, localAudioMuted, null);
        linkedParticipant.updateParticipant(false, false, false, participantId, localAudioMuted, false);
    }

    resetWitnessTransferTimeout(participantId: string) {
        clearTimeout(this.transferTimeout[participantId]);
        this.transferTimeout[participantId] = undefined;
    }

    resetAllWitnessTransferTimeouts() {
        for (const participantId of Object.keys(this.transferTimeout)) {
            this.resetWitnessTransferTimeout(participantId);
        }
    }

    setupVideoCallSubscribers() {
        this.logger.debug(`${this.loggerPrefix} Setting up pexip video call subscribers`);

        this.videoCallSubscription$.add(
            this.videoCallService
                .onParticipantCreated()
                .subscribe(createdParticipant => this.handleParticipantUpdatedInVideoCall(createdParticipant))
        );

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

        this.eventhubSubscription$.add(
            this.eventService.getParticipantsUpdated().subscribe(async message => {
                if (message.conferenceId === this.conferenceId) {
                    const mappedList = this.mapper.mapFromParticipantUserResponseArray(message.participants);
                    const newlyAddedParticipants = mappedList.filter(
                        ({ id: newId }) => !this.nonEndpointParticipants.some(({ id: oldId }) => newId === oldId)
                    );
                    newlyAddedParticipants.forEach(np => this.nonEndpointParticipants.push(np));

                    const nonEndpointParticipantsLinkedParticipantPanelIndex = this.nonEndpointParticipants.findIndex(
                        x => x.role === Role.JudicialOfficeHolder
                    );
                    const mappedListLinkedParticipantPanelIndex = mappedList.findIndex(x => x.role === Role.JudicialOfficeHolder);

                    if (nonEndpointParticipantsLinkedParticipantPanelIndex > -1 && mappedListLinkedParticipantPanelIndex > -1) {
                        const linkedParticipant = this.nonEndpointParticipants[
                            nonEndpointParticipantsLinkedParticipantPanelIndex
                        ] as LinkedParticipantPanelModel;

                        this.nonEndpointParticipants.splice(
                            nonEndpointParticipantsLinkedParticipantPanelIndex,
                            1,
                            mappedList[mappedListLinkedParticipantPanelIndex]
                        );

                        // Re-apply the state properties
                        const linkedParticipantToUpdate = this.nonEndpointParticipants[
                            nonEndpointParticipantsLinkedParticipantPanelIndex
                        ] as LinkedParticipantPanelModel;

                        linkedParticipantToUpdate.participants.forEach(p => {
                            const linkedParticipantParticipant = linkedParticipant.participants.find(lp => lp.id === p.id);
                            if (!linkedParticipantParticipant) {
                                return;
                            }

                            linkedParticipantToUpdate.updateParticipant(
                                linkedParticipant.isMicRemoteMuted(),
                                linkedParticipant.hasHandRaised(),
                                linkedParticipant.hasSpotlight(),
                                linkedParticipantParticipant.id,
                                linkedParticipantParticipant.isLocalMicMuted(),
                                linkedParticipantParticipant.isLocalCameraOff()
                            );
                        });

                        linkedParticipantToUpdate.assignPexipId(linkedParticipant.pexipId);
                    }

                    this.updateParticipants();
                }
            })
        );
    }

    handleParticipantHandRaiseChange(message: ParticipantHandRaisedMessage) {
        const participant = this.participants.find(x => x.hasParticipant(message.participantId));
        if (!participant) {
            return;
        }
        participant.updateParticipant(
            participant.isMicRemoteMuted(),
            message.handRaised,
            participant.hasSpotlight(),
            participant.id,
            participant.isLocalMicMuted(),
            participant.isLocalCameraOff()
        );

        this.logger.debug(`${this.loggerPrefix} Participant hand raised status has been updated`, {
            conference: this.conferenceId,
            participant: participant.id,
            participants: this.participants,
            handRaised: message.handRaised
        });
    }

    handleParticipantMediaStatusChange(message: ParticipantMediaStatusMessage) {
        const participant = this.participants.find(x => x.hasParticipant(message.participantId));

        if (!participant) {
            return;
        }
        if (participant instanceof LinkedParticipantPanelModel) {
            participant.updateParticipant(
                participant.isMicRemoteMuted(),
                participant.hasHandRaised(),
                participant.hasSpotlight(),
                message.participantId,
                message.mediaStatus.is_local_audio_muted,
                message.mediaStatus.is_local_video_muted
            );
        }

        participant.updateParticipantDeviceStatus(
            message.mediaStatus.is_local_audio_muted,
            message.mediaStatus.is_local_video_muted,
            message.participantId
        );
        this.logger.debug(`${this.loggerPrefix} Participant device status has been updated`, {
            conference: this.conferenceId,
            participant: participant.id,
            participants: this.participants,
            mediaStatus: message.mediaStatus
        });
    }

    handleHearingTransferChange(message: HearingTransfer) {
        const participant = this.participants.find(x => x.hasParticipant(message.participantId));
        if (!participant) {
            return;
        }
        participant.updateTransferringInStatus(message.transferDirection === TransferDirection.In, message.participantId);

        this.logger.debug(`${this.loggerPrefix} Participant status has been updated`, {
            conference: this.conferenceId,
            participant: participant.id,
            participants: this.participants,
            transferDirection: message.transferDirection
        });
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
            this.logger.warn(`${this.loggerPrefix} could NOT update participant in call`, {
                displayName: updatedParticipant.pexipDisplayName
            });
            return;
        }

        if (updatedParticipant.uuid) {
            participant.assignPexipId(updatedParticipant.uuid);
        }
        if (participant instanceof LinkedParticipantPanelModel) {
            participant.updateParticipant(
                updatedParticipant.isRemoteMuted,
                null,
                updatedParticipant.isSpotlighted,
                participant.id,
                participant.isLocalMicMuted(),
                participant.isLocalCameraOff()
            );
        } else {
            participant.updateParticipant(
                updatedParticipant.isRemoteMuted,
                updatedParticipant.handRaised,
                updatedParticipant.isSpotlighted,
                participant.id,
                participant.isLocalMicMuted(),
                participant.isLocalCameraOff()
            );
        }

        if (participant instanceof LinkedParticipantPanelModel) {
            participant.participants.forEach(async p => {
                await this.eventService.publishRemoteMuteStatus(this.conferenceId, p.id, updatedParticipant.isRemoteMuted);
            });
        }

        this.participantRemoteMuteStoreService.updateRemoteMuteStatus(participant.id, participant.isMicRemoteMuted());

        this.logger.debug(`${this.loggerPrefix} Participant has been updated in video call`, {
            conference: this.conferenceId,
            participant: participant.id,
            participants: this.participants,
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

        participant.updateStatus(message.status, message.participantId);
        participant.updateTransferringInStatus(false, message.participantId);

        this.logger.debug(`${this.loggerPrefix} Participant status has been updated`, {
            conference: this.conferenceId,
            participant: participant.id,
            participants: this.participants,
            status: message.status
        });
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
            this.nonEndpointParticipants = this.mapper.mapFromParticipantUserResponseArray(pats);
            this.logger.debug(`${this.loggerPrefix} Retrieved participants in conference`, { conference: this.conferenceId });
            (await eps).forEach(x => {
                const endpoint = new VideoEndpointPanelModel(x);
                this.endpointParticipants.push(endpoint);
            });
            this.logger.debug(`${this.loggerPrefix} Retrieved endpoints in conference`, { conference: this.conferenceId });
            this.setParticipants();
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
        const panelModel = this.participants.find(x => x.id === participant.id);

        this.logger.info(`${this.loggerPrefix} Judge is attempting to toggle spotlight for participant`, {
            conferenceId: this.conferenceId,
            unusedParticipantId: participant?.id ?? null,
            participantId: panelModel?.id ?? null,
            pexipId: panelModel?.pexipId ?? null,
            current: panelModel?.hasSpotlight(),
            new: !panelModel?.hasSpotlight()
        });

        if (!panelModel) {
            return;
        }

        if (!panelModel.pexipId && !panelModel.id) {
            this.logger.warn(`${this.loggerPrefix} Cannot spotlight participant as they could not be found or do not have an ID`, {
                participant: panelModel,
                participants: this.participants
            });
            return;
        }

        this.videoControlService.setSpotlightStatusById(panelModel.id, panelModel.pexipId, !panelModel.hasSpotlight());
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

        this.videoControlService.setRemoteMuteStatusById(p.id, p.pexipId, newMuteStatus);

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
        // ClearAllBuzz Pexip command currently does not signal VMR/Linked participant's ParticipantUpdated event handlers - calling them separately
        this.participants.forEach(participant => {
            if (participant instanceof LinkedParticipantPanelModel) {
                this.lowerLinkedParticipantHand(participant);
            }
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

    async callParticipantIntoHearing(participant: PanelModel) {
        if (!participant.isCallableAndReadyToJoin) {
            return;
        }
        this.logger.debug(`${this.loggerPrefix} Judge is attempting to call participant into hearing`, {
            conference: this.conferenceId,
            participant: participant.id
        });

        await this.sendTransferDirection(participant, TransferDirection.In);
        this.transferTimeout[participant.id] = setTimeout(() => {
            this.initiateTransfer(participant);
        }, 10000);
    }

    private async sendTransferDirection(participant: PanelModel, direction: TransferDirection) {
        if (participant instanceof LinkedParticipantPanelModel) {
            participant.participants.forEach(async linkedParticipant => {
                this.updateLocalAudioMutedForWitnessInterpreterVmr(linkedParticipant, participant.id, true);
                await this.eventService.sendTransferRequest(this.conferenceId, linkedParticipant.id, direction);
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

    async dismissParticipantFromHearing(participant: PanelModel) {
        if (!participant.isCallableAndReadyToBeDismissed) {
            return;
        }

        this.logger.debug(`${this.loggerPrefix} Judge is attempting to dismiss participant from hearing`, {
            conference: this.conferenceId,
            participant: participant.id
        });

        if (participant.hasHandRaised()) {
            this.lowerParticipantHand(participant);
        }
        if (participant.hasSpotlight()) {
            this.toggleSpotlightParticipant(participant);
        }

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

    isLinkedParticipantAndAnInterpreter(participant: PanelModel) {
        if (!(participant instanceof LinkedParticipantPanelModel)) {
            return false;
        }
        return participant.participants.some(x => x.hearingRole === HearingRole.INTERPRETER);
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
        let toolTipText = participant.displayName + this.getAdditionalText(participant);

        if (!participant.isDisconnected() && !participant.isInHearing()) {
            toolTipText = participant.displayName + ': ' + this.getTranslatedText('not-joined') + this.getAdditionalText(participant);
        }
        if (participant.isAvailable()) {
            toolTipText = participant.displayName + ': ' + this.getTranslatedText('joining') + this.getAdditionalText(participant);
        }
        if (participant.isWitness && participant.isAvailable() && !participant.isInHearing()) {
            toolTipText =
                participant.displayName + ': ' + this.getTranslatedText('participant-available') + this.getAdditionalText(participant);
        }
        if (participant.isDisconnected()) {
            toolTipText = participant.displayName + ': ' + this.getTranslatedText('disconnected') + this.getAdditionalText(participant);
        }

        return toolTipText;
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

    isWitness(participant: PanelModel) {
        return participant.isWitness;
    }

    private getHearingRole(participant: PanelModel): string {
        if (participant.caseTypeGroup?.toLowerCase() === CaseTypeGroup.PANEL_MEMBER.toLowerCase()) {
            return '';
        }
        const translatedtext = this.getTranslatedText('for');
        const hearingRoleText = this.translateService.instant('hearing-role.' + participant.hearingRole.toLowerCase().split(' ').join('-'));
        return participant.representee ? `<br/>${hearingRoleText} ${translatedtext} ${participant.representee}` : `<br/>${hearingRoleText}`;
    }

    private getCaseRole(participant: PanelModel): string {
        if (!participant.caseTypeGroup) {
            return '';
        }
        const translatedCaseTypeGroup = this.translateService.instant(
            'case-type-group.' + participant.caseTypeGroup.toLowerCase().split(' ').join('-')
        );
        return ParticipantsPanelComponent.showCaseRole(participant) ? `<br/>${translatedCaseTypeGroup}` : '';
    }

    private updateParticipants() {
        const combined = [...this.nonEndpointParticipants, ...this.endpointParticipants];
        this.getOrderedParticipants(combined);
    }

    private getOrderedParticipants(combined: PanelModel[]) {
        combined.sort((x, z) => {
            if (x.orderInTheList === z.orderInTheList) {
                // 4 here means regular participants and should be grouped by caseTypeGroup
                if (x.orderInTheList !== 4 || x.caseTypeGroup === z.caseTypeGroup) {
                    return x.displayName.localeCompare(z.displayName);
                }
                return x.caseTypeGroup.localeCompare(z.caseTypeGroup);
            }
            return x.orderInTheList > z.orderInTheList ? 1 : -1;
        });
        this.participants = combined;
    }

    private setParticipants() {
        const combined = [...this.nonEndpointParticipants, ...this.endpointParticipants];
        combined.forEach(item => {
            const currentParticipant = this.participants.find(r => r.id === item.id);
            if (currentParticipant) {
                if (currentParticipant instanceof LinkedParticipantPanelModel) {
                    currentParticipant.participants.forEach(linkedParticpant => {
                        ParticipantsPanelComponent.updateParticipant(item, linkedParticpant);
                    });
                } else {
                    ParticipantsPanelComponent.updateParticipant(item, currentParticipant);
                }
            } else {
                this.logger.warn(`${this.loggerPrefix} current participant is not in the list`, {
                    conference: this.conferenceId,
                    participant: item.id
                });
            }
        });

        this.getOrderedParticipants(combined);
    }
}
