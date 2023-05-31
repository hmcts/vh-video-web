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
    ConferenceStatus,
    ConsultationAnswer,
    EndpointStatus,
    HearingDetailRequest,
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

@Injectable({
    providedIn: 'root'
})
export class EventsService {
    private participantStatusSubject = new Subject<ParticipantStatusMessage>();
    private endpointStatusSubject = new Subject<EndpointStatusMessage>();
    private hearingStatusSubject = new Subject<ConferenceStatusMessage>();
    private participantsUpdatedSubject = new Subject<ParticipantsUpdatedMessage>();
    private endpointsUpdatedSubject = new Subject<EndpointsUpdatedMessage>();

    private hearingCountdownCompleteSubject = new Subject<string>();
    private helpMessageSubject = new Subject<HelpMessage>();

    private requestedConsultationMessageSubject = new Subject<RequestedConsultationMessage>();
    private consultationRequestResponseMessageSubject = new Subject<ConsultationRequestResponseMessage>();

    private messageSubject = new Subject<InstantMessage>();
    private adminAnsweredChatSubject = new Subject<ConferenceMessageAnswered>();
    private participantHeartbeat = new Subject<ParticipantHeartbeat>();
    private hearingTransferSubject = new Subject<HearingTransfer>();
    private participantMediaStatusSubject = new Subject<ParticipantMediaStatusMessage>();
    private participantRemoteMuteStatusSubject = new Subject<ParticipantRemoteMuteMessage>();
    private participantHandRaisedStatusSubject = new Subject<ParticipantHandRaisedMessage>();
    private participantToggleLocalMuteStatusSubject = new Subject<ParticipantToggleLocalMuteMessage>();
    private roomUpdateSubject = new Subject<Room>();
    private roomTransferSubject = new Subject<RoomTransfer>();
    private hearingLayoutChangedSubject = new Subject<HearingLayoutChanged>();
    private messageAllocationSubject = new Subject<NewAllocationMessage>();

    private _handlersRegistered = false;

    private eventHandlers = {
        ParticipantStatusMessage: (participantId: string, username: string, conferenceId: string, status: ParticipantStatus) => {
            const message = new ParticipantStatusMessage(participantId, username, conferenceId, status);
            this.logger.debug('[EventsService] - ParticipantStatusMessage received', message);
            this.participantStatusSubject.next(message);
        },

        NewConferenceAddedMessage: (conferenceId: string) => {
            this.eventsHubConnection.invoke('AddToGroup', conferenceId);
        },

        AllocationHearings: (csoUserName: string, hearingDetails: HearingDetailRequest[]) => {
            this.eventsHubConnection.invoke('AddToGroup', csoUserName);
            const message = new NewAllocationMessage(hearingDetails);
            this.logger.debug('[EventsService] - ReceiveMessage allocation for {csoUserName} for hearings');
            this.messageAllocationSubject.next(message);
        },

        EndpointStatusMessage: (endpointId: string, conferenceId: string, status: EndpointStatus) => {
            const message = new EndpointStatusMessage(endpointId, conferenceId, status);
            this.logger.debug('[EventsService] - EndpointStatusMessage received', message);

            this.endpointStatusSubject.next(message);
        },

        ConferenceStatusMessage: (conferenceId: string, status: ConferenceStatus) => {
            const message = new ConferenceStatusMessage(conferenceId, status);
            this.logger.debug('[EventsService] - ConferenceStatusMessage received', message);
            this.hearingStatusSubject.next(message);
        },

        ParticipantsUpdatedMessage: (conferenceId: string, participants: ParticipantResponse[]) => {
            const message = new ParticipantsUpdatedMessage(conferenceId, participants);
            this.logger.debug('[EventsService] - ParticipantsUpdatedMessage received', message);
            this.participantsUpdatedSubject.next(message);
        },

        EndpointsUpdated: (conferenceId: string, endpoints: UpdateEndpointsDto) => {
            const message = new EndpointsUpdatedMessage(conferenceId, endpoints);
            this.logger.debug('[EventsService] - EndpointsUpdatedMessage received', message);
            this.endpointsUpdatedSubject.next(message);
        },

        CountdownFinished: (conferenceId: string) => {
            this.logger.debug('[EventsService] - CountdownFinished received', conferenceId);
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
            this.consultationRequestResponseMessageSubject.next(message);
        },

        ReceiveMessage: (conferenceId: string, from: string, to: string, message: string, timestamp: Date, messageUuid: string) => {
            const date = new Date(timestamp);
            const chat = new InstantMessage({ conferenceId, id: messageUuid, to, from, message, timestamp: date });
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
            this.hearingTransferSubject.next(payload);
        },

        ParticipantMediaStatusMessage: (participantId: string, conferenceId: string, mediaStatus: ParticipantMediaStatus) => {
            const payload = new ParticipantMediaStatusMessage(conferenceId, participantId, mediaStatus);
            this.logger.debug('[EventsService] - Participant Media Status change received: ', payload);
            this.participantMediaStatusSubject.next(payload);
        },

        ParticipantRemoteMuteMessage: (participantId: string, conferenceId: string, isRemoteMuted: boolean) => {
            this.logger.debug('[EventsService] - Participant Remote mute status change received: ', {
                participantId,
                conferenceId,
                isRemoteMuted
            });
            const payload = new ParticipantRemoteMuteMessage(conferenceId, participantId, isRemoteMuted);
            this.participantRemoteMuteStatusSubject.next(payload);
        },

        ParticipantHandRaiseMessage: (participantId: string, conferenceId: string, hasHandRaised: boolean) => {
            this.logger.debug('[EventsService] - Participant Hand raised status change received: ', {
                participantId,
                conferenceId,
                hasHandRaised
            });
            const payload = new ParticipantHandRaisedMessage(conferenceId, participantId, hasHandRaised);
            this.participantHandRaisedStatusSubject.next(payload);
        },

        updateparticipantlocalmutemessage: (conferenceId: string, participantId: string, isMuted: boolean) => {
            this.logger.debug('[EventsService] - Participant Local mute status change received: ', {
                participantId,
                conferenceId,
                isMuted
            });
            const payload = new ParticipantToggleLocalMuteMessage(conferenceId, participantId, isMuted);
            this.participantToggleLocalMuteStatusSubject.next(payload);
        },

        RoomUpdate: (payload: Room) => {
            this.logger.debug('[EventsService] - Room Update received: ', payload);
            this.roomUpdateSubject.next(payload);
        },

        RoomTransfer: (payload: RoomTransfer) => {
            this.logger.debug('[EventsService] - Room Transfer received: ', payload);
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
            this.hearingLayoutChangedSubject.next(hearingLayoutChanged);
        }
    };

    constructor(private logger: Logger, private eventsHubService: EventsHubService) {
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
        this.logger.info('[EventsService] - Start.');

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
        return this.hearingStatusSubject.asObservable();
    }

    getEndpointStatusMessage(): Observable<EndpointStatusMessage> {
        return this.endpointStatusSubject.asObservable();
    }

    getHearingCountdownCompleteMessage(): Observable<string> {
        return this.hearingCountdownCompleteSubject.asObservable();
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

    getHearingLayoutChanged(): Observable<HearingLayoutChanged> {
        return this.hearingLayoutChangedSubject.asObservable();
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
}
