import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { HearingLayoutChanged } from 'src/app/services/models/hearing-layout-changed';
import { Heartbeat } from '../shared/models/heartbeat';
import { ParticipantHandRaisedMessage } from '../shared/models/participant-hand-raised-message';
import { ParticipantMediaStatus } from '../shared/models/participant-media-status';
import { ParticipantMediaStatusMessage } from '../shared/models/participant-media-status-message';
import { ParticipantRemoteMuteMessage } from '../shared/models/participant-remote-mute-message';
import { ParticipantsUpdatedMessage } from '../shared/models/participants-updated-message';
import { EndpointsUpdatedMessage } from '../shared/models/endpoints-updated-message';
import { Room } from '../shared/models/room';
import { RoomTransfer } from '../shared/models/room-transfer';
import {
    ConferenceResponse,
    ConferenceStatus,
    ConsultationAnswer,
    EndpointStatus,
    HearingLayout,
    ParticipantResponse,
    ParticipantStatus
} from './clients/api-client';
import { EventsHubService } from './events-hub.service';
import { Logger } from './logging/logger-base';
import { ConferenceMessageAnswered } from './models/conference-message-answered';
import { ConferenceStatusMessage } from './models/conference-status-message';
import { ConsultationRequestResponseMessage } from './models/consultation-request-response-message';
import { EndpointStatusMessage } from './models/EndpointStatusMessage';
import { HearingTransfer, TransferDirection } from './models/hearing-transfer';
import { HelpMessage } from './models/help-message';
import { InstantMessage } from './models/instant-message';
import { HeartbeatHealth, ParticipantHeartbeat } from './models/participant-heartbeat';
import { ParticipantStatusMessage } from './models/participant-status-message';
import { RequestedConsultationMessage } from './models/requested-consultation-message';
import { NewAllocationMessage } from './models/new-allocation-message';
import { UpdateEndpointsDto } from '../shared/models/update-endpoints-dto';
import { ParticipantToggleLocalMuteMessage } from '../shared/models/participant-toggle-local-mute-message';
import { EndpointRepMessage } from '../shared/models/endpoint-rep-message';
import { ConferenceState } from '../waiting-space/store/reducers/conference.reducer';
import { Store } from '@ngrx/store';
import { ConferenceActions } from '../waiting-space/store/actions/conference.actions';
import * as ConferenceSelectors from '../waiting-space/store/selectors/conference.selectors';
import {
    mapConferenceToVHConference,
    mapEndpointToVHEndpoint,
    mapParticipantToVHParticipant
} from '../waiting-space/store/models/api-contract-to-state-model-mappers';
import { distinctUntilChanged, take } from 'rxjs/operators';
import { NewConferenceAddedMessage } from './models/new-conference-added-message';
import { HearingDetailsUpdatedMessage } from './models/hearing-details-updated-message';
import { HearingCancelledMessage } from './models/hearing-cancelled-message';
import { AudioRecordingPauseStateMessage } from '../shared/models/audio-recording-pause-state-message';
import { UpdatedAllocation } from '../shared/models/update-allocation-dto';
import { VideoCallActions } from '../waiting-space/store/actions/video-call.action';
import { AudioRecordingActions } from '../waiting-space/store/actions/audio-recording.actions';

@Injectable({
    providedIn: 'root'
})
export class EventsService {
    private readonly participantStatusSubject = new Subject<ParticipantStatusMessage>();
    private readonly endpointStatusSubject = new Subject<EndpointStatusMessage>();
    private readonly hearingStatusSubject = new Subject<ConferenceStatusMessage>();
    private readonly participantsUpdatedSubject = new Subject<ParticipantsUpdatedMessage>();
    private readonly endpointsUpdatedSubject = new Subject<EndpointsUpdatedMessage>();
    private readonly endpointUnlinkedSubject = new Subject<EndpointRepMessage>();
    private readonly endpointLinkedSubject = new Subject<EndpointRepMessage>();
    private readonly endpointDisconnectSubject = new Subject<EndpointRepMessage>();

    private readonly hearingCountdownCompleteSubject = new Subject<string>();
    private readonly helpMessageSubject = new Subject<HelpMessage>();

    private readonly requestedConsultationMessageSubject = new Subject<RequestedConsultationMessage>();
    private readonly consultationRequestResponseMessageSubject = new Subject<ConsultationRequestResponseMessage>();

    private readonly messageSubject = new Subject<InstantMessage>();
    private readonly adminAnsweredChatSubject = new Subject<ConferenceMessageAnswered>();
    private readonly participantHeartbeat = new Subject<ParticipantHeartbeat>();
    private readonly hearingTransferSubject = new Subject<HearingTransfer>();
    private readonly participantMediaStatusSubject = new Subject<ParticipantMediaStatusMessage>();
    private readonly participantRemoteMuteStatusSubject = new Subject<ParticipantRemoteMuteMessage>();
    private readonly participantHandRaisedStatusSubject = new Subject<ParticipantHandRaisedMessage>();
    private readonly participantToggleLocalMuteStatusSubject = new Subject<ParticipantToggleLocalMuteMessage>();
    private readonly audioRestartActionedSubject = new Subject<string>();
    private readonly audioPausedActionSubject = new Subject<AudioRecordingPauseStateMessage>();
    private readonly roomUpdateSubject = new Subject<Room>();
    private readonly roomTransferSubject = new Subject<RoomTransfer>();
    private readonly hearingLayoutChangedSubject = new Subject<HearingLayoutChanged>();
    private readonly messageAllocationSubject = new Subject<NewAllocationMessage>();
    private readonly newConferenceAddedSubject = new Subject<NewConferenceAddedMessage>();
    private readonly hearingDetailsUpdatedSubject = new Subject<HearingDetailsUpdatedMessage>();
    private readonly hearingCancelledSubject = new Subject<HearingCancelledMessage>();

    private _handlersRegistered = false;

    private eventHandlers = {
        ParticipantStatusMessage: (
            participantId: string,
            username: string,
            conferenceId: string,
            status: ParticipantStatus,
            reason: string
        ) => {
            const message = new ParticipantStatusMessage(participantId, username, conferenceId, status);
            this.logger.debug('[EventsService] - ParticipantStatusMessage received', message);
            this.store.dispatch(ConferenceActions.updateParticipantStatus({ conferenceId, participantId, status, reason }));
            this.participantStatusSubject.next(message);
        },

        NewConferenceAddedMessage: (conferenceId: string) => {
            this.eventsHubConnection.invoke('AddToGroup', conferenceId);
            const message = new NewConferenceAddedMessage(conferenceId);
            this.logger.debug('[EventsService] - NewConferenceAddedMessage received', message);
            this.newConferenceAddedSubject.next(message);
        },

        HearingDetailsUpdatedMessage: (conference: ConferenceResponse) => {
            const message = new HearingDetailsUpdatedMessage(conference);
            this.logger.debug('[EventsService] - HearingDetailsUpdatedMessage received', message);
            this.store.dispatch(ConferenceActions.loadConferenceSuccess({ conference: mapConferenceToVHConference(message.conference) }));
            this.hearingDetailsUpdatedSubject.next(message);
        },

        HearingCancelledMessage: (conferenceId: string) => {
            const message = new HearingCancelledMessage(conferenceId);
            this.logger.debug('[EventsService] - HearingCancelled received', message);
            this.hearingCancelledSubject.next(message);
        },

        AllocationsUpdated: (updatedAllocations: UpdatedAllocation[]) => {
            const message = new NewAllocationMessage(updatedAllocations);
            updatedAllocations?.forEach(allocation => {
                this.eventsHubConnection.invoke('AddToGroup', allocation.conference.id);
            });
            this.logger.debug('[EventsService] - AllocationsUpdated received', message);
            this.messageAllocationSubject.next(message);
        },

        EndpointStatusMessage: (endpointId: string, conferenceId: string, status: EndpointStatus) => {
            const message = new EndpointStatusMessage(endpointId, conferenceId, status);
            this.logger.debug('[EventsService] - EndpointStatusMessage received', message);
            this.store.dispatch(ConferenceActions.updateEndpointStatus({ conferenceId, endpointId, status }));
            this.endpointStatusSubject.next(message);
        },

        ConferenceStatusMessage: (conferenceId: string, status: ConferenceStatus) => {
            const message = new ConferenceStatusMessage(conferenceId, status);
            this.logger.debug('[EventsService] - ConferenceStatusMessage received', message);
            this.store.dispatch(ConferenceActions.updateActiveConferenceStatus({ conferenceId, status }));

            this.hearingStatusSubject.next(message);
        },

        ParticipantsUpdatedMessage: (conferenceId: string, participants: ParticipantResponse[]) => {
            const message = new ParticipantsUpdatedMessage(conferenceId, participants);
            this.logger.debug('[EventsService] - ParticipantsUpdatedMessage received', message);
            const vhParticipants = participants.map(p => mapParticipantToVHParticipant(p));
            this.store.dispatch(ConferenceActions.updateParticipantList({ conferenceId, participants: vhParticipants }));
            this.participantsUpdatedSubject.next(message);
        },

        EndpointsUpdated: (conferenceId: string, endpoints: UpdateEndpointsDto) => {
            const message = new EndpointsUpdatedMessage(conferenceId, endpoints);
            this.logger.debug('[EventsService] - EndpointsUpdatedMessage received', message);

            const existingEndpoints = endpoints.existing_endpoints.map(e => mapEndpointToVHEndpoint(e));
            this.store.dispatch(ConferenceActions.updateExistingEndpoints({ conferenceId, endpoints: existingEndpoints }));

            const newEndpoints = endpoints.new_endpoints.map(e => mapEndpointToVHEndpoint(e));
            this.store.dispatch(ConferenceActions.addNewEndpoints({ conferenceId, endpoints: newEndpoints }));

            this.store.dispatch(
                ConferenceActions.removeExistingEndpoints({
                    conferenceId,
                    removedEndpointIds: endpoints.removed_endpoints.map(e => e.toString())
                })
            );
            this.endpointsUpdatedSubject.next(message);
        },

        UnlinkedParticipantFromEndpoint: (conferenceId: string, endpoint: string) => {
            const message = new EndpointRepMessage(conferenceId, endpoint);
            this.logger.debug('[EventsService] - UnlinkedParticipantFromEndpoint received', message);
            this.store.dispatch(ConferenceActions.unlinkParticipantFromEndpoint({ conferenceId, endpoint }));
            this.endpointUnlinkedSubject.next(message);
        },

        LinkedNewParticipantToEndpoint: (conferenceId: string, endpoint: string) => {
            const message = new EndpointRepMessage(conferenceId, endpoint);
            this.logger.debug('[EventsService] - LinkedParticipantFromEndpoint received', message);
            this.store.dispatch(ConferenceActions.linkParticipantToEndpoint({ conferenceId, endpoint }));
            this.endpointLinkedSubject.next(message);
        },

        CloseConsultationBetweenEndpointAndParticipant: (conferenceId: string, endpoint: string) => {
            const message = new EndpointRepMessage(conferenceId, endpoint);
            this.logger.debug('[EventsService] - CloseConsultationBetweenEndpointAndParticipant received', message);
            this.store.dispatch(ConferenceActions.closeConsultationBetweenEndpointAndParticipant({ conferenceId, endpoint }));
            this.endpointDisconnectSubject.next(message);
        },

        CountdownFinished: (conferenceId: string) => {
            this.logger.debug('[EventsService] - CountdownFinished received', conferenceId);
            this.store.dispatch(ConferenceActions.countdownComplete({ conferenceId }));
            this.hearingCountdownCompleteSubject.next(conferenceId);
        },

        HelpMessage: (conferenceId: string, participantName: string) => {
            const message = new HelpMessage(conferenceId, participantName);
            this.logger.debug('[EventsService] - HelpMessage received', message);
            this.helpMessageSubject.next(message);
        },

        RequestedConsultationMessage: (
            conferenceId: string,
            invitationId: string,
            roomLabel: string,
            requestedBy: string,
            requestedFor: string
        ) => {
            const message = new RequestedConsultationMessage(conferenceId, invitationId, roomLabel, requestedBy, requestedFor);
            this.logger.debug('[EventsService] - RequestConsultationMessage received', message);
            this.store.dispatch(
                ConferenceActions.consultationRequested({ conferenceId, requestedFor, requestedBy, invitationId, roomLabel })
            );
            this.store.dispatch(
                ConferenceActions.upsertConsultationCallStatus({
                    conferenceId,
                    participantId: requestedFor,
                    invitationId,
                    roomLabel,
                    requestedBy,
                    requestedFor,
                    callStatus: 'Calling'
                })
            );
            this.requestedConsultationMessageSubject.next(message);
        },

        ConsultationRequestResponseMessage: (
            conferenceId: string,
            invitationId: string,
            roomLabel: string,
            requestedFor: string,
            answer: ConsultationAnswer,
            responseInitiatorId: string
        ) => {
            const message = new ConsultationRequestResponseMessage(
                conferenceId,
                invitationId,
                roomLabel,
                requestedFor,
                answer,
                responseInitiatorId
            );
            this.logger.debug('[EventsService] - ConsultationRequestResponseMessage received', message);
            this.store.dispatch(
                ConferenceActions.consultationResponded({
                    conferenceId,
                    invitationId,
                    answer,
                    roomLabel,
                    requestedFor,
                    responseInitiatorId
                })
            );
            this.consultationRequestResponseMessageSubject.next(message);
        },

        ReceiveMessage: (
            conferenceId: string,
            from: string,
            fromDisplayName: string,
            to: string,
            message: string,
            timestamp: Date,
            messageUuid: string
        ) => {
            const date = new Date(timestamp);
            const chat = new InstantMessage({
                conferenceId,
                id: messageUuid,
                to,
                from,
                from_display_name: fromDisplayName,
                message,
                timestamp: date
            });
            this.logger.debug('[EventsService] - ReceiveMessage received', chat);
            this.messageSubject.next(chat);
        },

        AdminAnsweredChat: (conferenceId: string, participantId: string) => {
            const payload = new ConferenceMessageAnswered(conferenceId, participantId);
            this.logger.debug('[EventsService] - AdminAnsweredChat received', payload);
            this.adminAnsweredChatSubject.next(payload);
        },

        HearingTransfer: (conferenceId: string, participantId: string, hearingPosition: TransferDirection) => {
            const payload = new HearingTransfer(conferenceId, participantId, hearingPosition);
            this.logger.debug('[EventsService] - HearingTransfer received: ', payload);
            this.store.dispatch(
                ConferenceActions.updateParticipantHearingTransferStatus({
                    conferenceId,
                    participantId,
                    transferDirection: hearingPosition
                })
            );
            this.hearingTransferSubject.next(payload);
        },

        NonHostTransfer: (conferenceId: string, participantId: string, transferDirection: TransferDirection) => {
            if (transferDirection === TransferDirection.Out) {
                this.store
                    .select(ConferenceSelectors.getParticipantById(participantId))
                    .pipe(take(1))
                    .subscribe(participant => {
                        this.store.dispatch(VideoCallActions.participantLeaveHearingRoomSuccess({ conferenceId, participant }));
                    });
            }
        },

        ParticipantMediaStatusMessage: (participantId: string, conferenceId: string, mediaStatus: ParticipantMediaStatus) => {
            const payload = new ParticipantMediaStatusMessage(conferenceId, participantId, mediaStatus);
            this.logger.debug('[EventsService] - Participant Media Status change received: ', payload);
            this.store.dispatch(ConferenceActions.updateParticipantMediaStatus({ conferenceId, participantId, mediaStatus }));
            this.participantMediaStatusSubject.next(payload);
        },

        ParticipantRemoteMuteMessage: (participantId: string, conferenceId: string, isRemoteMuted: boolean) => {
            this.logger.debug('[EventsService] - Participant Remote mute status change received: ', {
                participantId,
                conferenceId,
                isRemoteMuted
            });
            const payload = new ParticipantRemoteMuteMessage(conferenceId, participantId, isRemoteMuted);
            this.store.dispatch(ConferenceActions.updateParticipantRemoteMuteStatus({ conferenceId, participantId, isRemoteMuted }));
            this.participantRemoteMuteStatusSubject.next(payload);
        },

        ParticipantHandRaiseMessage: (participantId: string, conferenceId: string, hasHandRaised: boolean) => {
            this.logger.debug('[EventsService] - Participant Hand raised status change received: ', {
                participantId,
                conferenceId,
                hasHandRaised
            });
            const payload = new ParticipantHandRaisedMessage(conferenceId, participantId, hasHandRaised);
            this.store.dispatch(ConferenceActions.updateParticipantHandRaised({ conferenceId, participantId, hasHandRaised }));
            this.participantHandRaisedStatusSubject.next(payload);
        },

        AudioRestartActioned: (conferenceId: string) => {
            this.logger.debug('[EventsService] - Audio restart actioned received: ', conferenceId);
            this.store.dispatch(AudioRecordingActions.audioRecordingRestarted({ conferenceId }));
            this.audioRestartActionedSubject.next(conferenceId);
        },

        AudioRecordingPaused: (conferenceId: string, state: boolean) => {
            this.logger.debug('[EventsService] - Audio restart actioned received: ', conferenceId);
            if (state) {
                this.store.dispatch(AudioRecordingActions.pauseAudioRecordingSuccess({ conferenceId }));
            } else {
                this.store.dispatch(AudioRecordingActions.resumeAudioRecordingSuccess({ conferenceId }));
            }
            this.audioPausedActionSubject.next(new AudioRecordingPauseStateMessage(conferenceId, state));
        },

        updateparticipantlocalmutemessage: (conferenceId: string, participantId: string, isMuted: boolean) => {
            this.logger.debug('[EventsService] - Participant Local mute status change received: ', {
                participantId,
                conferenceId,
                isMuted
            });
            const payload = new ParticipantToggleLocalMuteMessage(conferenceId, participantId, isMuted);
            this.store.dispatch(ConferenceActions.updateParticipantLocalMuteStatus({ conferenceId, participantId, isMuted }));
            this.participantToggleLocalMuteStatusSubject.next(payload);
        },

        RoomUpdate: (payload: Room) => {
            this.logger.debug('[EventsService] - Room Update received: ', payload);
            this.store.dispatch(ConferenceActions.updateRoom({ room: { label: payload.label, locked: payload.locked } }));
            this.roomUpdateSubject.next(payload);
        },

        RoomTransfer: (payload: RoomTransfer) => {
            this.logger.debug('[EventsService] - Room Transfer received: ', payload);
            this.store.dispatch(
                ConferenceActions.updateParticipantRoom({
                    participantId: payload.participant_id,
                    fromRoom: payload.from_room,
                    toRoom: payload.to_room
                })
            );
            this.roomTransferSubject.next(payload);
        },

        ReceiveHeartbeat: (
            conferenceId: string,
            participantId: string,
            heartbeatHealth: HeartbeatHealth,
            browserName: string,
            browserVersion: string,
            osName: string,
            osVersion: string
        ) => {
            const heartbeat = new ParticipantHeartbeat(
                conferenceId,
                participantId,
                heartbeatHealth,
                browserName,
                browserVersion,
                osName,
                osVersion
            );
            this.participantHeartbeat.next(heartbeat);
        },

        HearingLayoutChanged: (
            conferenceId: string,
            changedById: string,
            newHearingLayout: HearingLayout,
            oldHearingLayout?: HearingLayout
        ) => {
            const hearingLayoutChanged = new HearingLayoutChanged(conferenceId, changedById, newHearingLayout, oldHearingLayout);
            this.store.dispatch(ConferenceActions.hearingLayoutChanged({ conferenceId, changedById, newHearingLayout, oldHearingLayout }));
            this.hearingLayoutChangedSubject.next(hearingLayoutChanged);
        }
    };

    constructor(
        private logger: Logger,
        private eventsHubService: EventsHubService,
        private store: Store<ConferenceState>
    ) {
        eventsHubService.onEventsHubReady.subscribe(() => this.start());
    }

    get handlersRegistered() {
        return this._handlersRegistered;
    }

    get eventHubIsConnected(): boolean {
        return this.eventsHubService.isConnectedToHub;
    }

    private get eventsHubConnection() {
        return this.eventsHubService.connection;
    }

    start() {
        this.logger.debug('[EventsService] - Start.');

        this.registerHandlers();
    }

    stop() {
        this.deregisterHandlers();
    }

    registerHandlers(): void {
        if (this.handlersRegistered) {
            this.logger.warn('[EventsService] - Handlers already registered. Skipping registeration of handlers.');
            return;
        }

        for (const eventName in this.eventHandlers) {
            if (this.eventHandlers.hasOwnProperty(eventName)) {
                this.eventsHubConnection.on(eventName, this.eventHandlers[eventName]);
            }
        }

        this._handlersRegistered = true;
    }

    deregisterHandlers(): void {
        if (!this.handlersRegistered) {
            this.logger.warn('[EventsService] - Handlers are not registered. Skipping deregisteration of handlers.');
            return;
        }

        for (const eventName in this.eventHandlers) {
            if (this.eventHandlers.hasOwnProperty(eventName)) {
                this.eventsHubConnection.off(eventName, this.eventHandlers[eventName]);
            }
        }

        this._handlersRegistered = false;
    }

    onEventsHubReady(): Observable<any> {
        return this.eventsHubService.onEventsHubReady;
    }

    getServiceConnected(): Observable<any> {
        return this.eventsHubService.getServiceConnected();
    }

    getServiceDisconnected(): Observable<number> {
        return this.eventsHubService.getServiceDisconnected();
    }

    getParticipantStatusMessage(): Observable<ParticipantStatusMessage> {
        return this.participantStatusSubject.asObservable();
    }

    getAllocationMessage(): Observable<NewAllocationMessage> {
        return this.messageAllocationSubject.asObservable();
    }

    getHearingStatusMessage(): Observable<ConferenceStatusMessage> {
        return this.hearingStatusSubject
            .asObservable()
            .pipe(distinctUntilChanged((a, b) => a.conferenceId === b.conferenceId && a.status === b.status));
    }

    getEndpointStatusMessage(): Observable<EndpointStatusMessage> {
        return this.endpointStatusSubject
            .asObservable()
            .pipe(distinctUntilChanged((a, b) => a.endpointId === b.endpointId && a.status === b.status));
    }

    getHearingCountdownCompleteMessage(): Observable<string> {
        return this.hearingCountdownCompleteSubject.asObservable().pipe(distinctUntilChanged());
    }

    getRequestedConsultationMessage(): Observable<RequestedConsultationMessage> {
        return this.requestedConsultationMessageSubject.asObservable();
    }

    getConsultationRequestResponseMessage(): Observable<ConsultationRequestResponseMessage> {
        return this.consultationRequestResponseMessageSubject.asObservable();
    }

    getChatMessage(): Observable<InstantMessage> {
        return this.messageSubject.asObservable();
    }

    getAdminAnsweredChat(): Observable<ConferenceMessageAnswered> {
        return this.adminAnsweredChatSubject.asObservable();
    }

    getHeartbeat(): Observable<ParticipantHeartbeat> {
        return this.participantHeartbeat.asObservable();
    }

    getHearingTransfer(): Observable<HearingTransfer> {
        return this.hearingTransferSubject.asObservable();
    }

    getParticipantMediaStatusMessage(): Observable<ParticipantMediaStatusMessage> {
        return this.participantMediaStatusSubject.asObservable();
    }

    getParticipantRemoteMuteStatusMessage(): Observable<ParticipantRemoteMuteMessage> {
        return this.participantRemoteMuteStatusSubject.asObservable();
    }

    getParticipantHandRaisedMessage(): Observable<ParticipantHandRaisedMessage> {
        return this.participantHandRaisedStatusSubject.asObservable();
    }

    getParticipantToggleLocalMuteMessage(): Observable<ParticipantToggleLocalMuteMessage> {
        return this.participantToggleLocalMuteStatusSubject.asObservable();
    }

    getRoomUpdate(): Observable<Room> {
        return this.roomUpdateSubject.asObservable();
    }
    getRoomTransfer(): Observable<RoomTransfer> {
        return this.roomTransferSubject.asObservable();
    }

    getParticipantsUpdated(): Observable<ParticipantsUpdatedMessage> {
        return this.participantsUpdatedSubject.asObservable();
    }

    getEndpointsUpdated(): Observable<EndpointsUpdatedMessage> {
        return this.endpointsUpdatedSubject.asObservable();
    }

    getEndpointUnlinkedUpdated(): Observable<EndpointRepMessage> {
        return this.endpointUnlinkedSubject.asObservable();
    }

    getEndpointLinkedUpdated(): Observable<EndpointRepMessage> {
        return this.endpointLinkedSubject.asObservable();
    }

    getEndpointDisconnectUpdated(): Observable<EndpointRepMessage> {
        return this.endpointDisconnectSubject.asObservable();
    }

    getHearingLayoutChanged(): Observable<HearingLayoutChanged> {
        return this.hearingLayoutChangedSubject.asObservable();
    }

    getAudioRestartActioned(): Observable<string> {
        return this.audioRestartActionedSubject.asObservable();
    }

    getAudioPaused(): Observable<AudioRecordingPauseStateMessage> {
        return this.audioPausedActionSubject.asObservable();
    }

    getNewConferenceAdded(): Observable<NewConferenceAddedMessage> {
        return this.newConferenceAddedSubject.asObservable();
    }

    getHearingCancelled(): Observable<HearingCancelledMessage> {
        return this.hearingCancelledSubject.asObservable();
    }

    getHearingDetailsUpdated(): Observable<HearingDetailsUpdatedMessage> {
        return this.hearingDetailsUpdatedSubject.asObservable();
    }

    async sendMessage(instantMessage: InstantMessage) {
        this.logger.debug('[EventsService] - Sent message to EventHub', instantMessage);
        try {
            await this.eventsHubConnection.send(
                'SendMessage',
                instantMessage.conferenceId,
                instantMessage.message,
                instantMessage.to,
                instantMessage.id
            );
        } catch (err) {
            this.logger.error(`[EventsService] - Unable to send im from ${instantMessage.from}`, err);
            throw err;
        }
    }

    async sendHeartbeat(conferenceId: string, participantId: string, heartbeat: Heartbeat) {
        await this.eventsHubConnection.send('SendHeartbeat', conferenceId, participantId, heartbeat);
        this.logger.debug('[EventsService] - Sent heartbeat to EventHub', heartbeat);
    }

    async sendTransferRequest(conferenceId: string, participantId: string, transferDirection: TransferDirection) {
        await this.eventsHubConnection.send('sendTransferRequest', conferenceId, participantId, transferDirection);
        this.logger.debug('[EventsService] - Sent transfer request to EventHub', transferDirection);
    }

    async publishRemoteMuteStatus(conferenceId: string, participantId: string, isRemoteMuted: boolean) {
        await this.eventsHubConnection.send('UpdateParticipantRemoteMuteStatus', conferenceId, participantId, isRemoteMuted);
        this.logger.debug('[EventsService] - Sent update remote mute status request to EventHub', {
            conference: conferenceId,
            participant: participantId,
            isRemoteMuted
        });
    }

    async publishParticipantHandRaisedStatus(conferenceId: string, participantId: string, isRaised: boolean) {
        await this.eventsHubConnection.send('UpdateParticipantHandStatus', conferenceId, participantId, isRaised);
        this.logger.debug('[EventsService] - Sent update hand raised status request to EventHub', {
            conference: conferenceId,
            participant: participantId,
            isRaised
        });
    }

    async updateParticipantLocalMuteStatus(conferenceId: string, participantId: string, isMuted: boolean) {
        await this.eventsHubConnection.send('ToggleParticipantLocalMute', conferenceId, participantId, isMuted);
        this.logger.debug('[EventsService] - Sent update local mute status request for participant to EventHub', {
            conference: conferenceId,
            participant: participantId,
            isMuted
        });
    }

    async updateAllParticipantLocalMuteStatus(conferenceId: string, isMuted: boolean) {
        await this.eventsHubConnection.send('ToggleAllParticipantLocalMute', conferenceId, isMuted);
        this.logger.debug('[EventsService] - Sent update local mute status request for all participants to EventHub', {
            conference: conferenceId,
            isMuted
        });
    }

    async sendMediaStatus(conferenceId: string, participantId: string, mediaStatus: ParticipantMediaStatus) {
        await this.eventsHubConnection.send('SendMediaDeviceStatus', conferenceId, participantId, mediaStatus);
        this.logger.debug('[EventsService] - Sent device media status to EventHub', {
            conference: conferenceId,
            participant: participantId,
            mediaStatus: mediaStatus
        });
    }

    async sendAudioRestartActioned(conferenceId: string, participantId: string) {
        await this.eventsHubConnection.send('SendAudioRestartAction', conferenceId, participantId);
        this.logger.debug('[EventsService] - Sent device Audio Restart action to EventHub', {
            conference: conferenceId,
            participant: participantId
        });
    }

    async sendAudioRecordingPaused(conferenceId: string, state: boolean) {
        await this.eventsHubConnection.send('SendAudioRecordingPaused', conferenceId, state);
        this.logger.debug('[EventsService] - Sent audio recording paused action to EventHub', {
            conference: conferenceId
        });
    }
}
