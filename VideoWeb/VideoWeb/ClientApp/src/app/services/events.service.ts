import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { Heartbeat } from '../shared/models/heartbeat';
import { Room } from '../shared/models/room';
import { ParticipantMediaStatus } from '../shared/models/participant-media-status';
import { ParticipantMediaStatusMessage } from '../shared/models/participant-media-status-message';
import { ConferenceMessageAnswered } from './models/conference-message-answered';
import { ConferenceStatus, ConsultationAnswer, EndpointStatus, ParticipantResponse, ParticipantStatus } from './clients/api-client';
import { Logger } from './logging/logger-base';

import { ConsultationRequestResponseMessage } from './models/consultation-request-response-message';
import { RequestedConsultationMessage } from './models/requested-consultation-message';

import { ConferenceStatusMessage } from './models/conference-status-message';
import { EndpointStatusMessage } from './models/EndpointStatusMessage';
import { HearingTransfer, TransferDirection } from './models/hearing-transfer';
import { HelpMessage } from './models/help-message';
import { InstantMessage } from './models/instant-message';
import { HeartbeatHealth, ParticipantHeartbeat } from './models/participant-heartbeat';
import { ParticipantStatusMessage } from './models/participant-status-message';
import { RoomTransfer } from '../shared/models/room-transfer';
import { ParticipantHandRaisedMessage } from '../shared/models/participant-hand-raised-message';
import { ParticipantRemoteMuteMessage } from '../shared/models/participant-remote-mute-message';
import { EventsHubService } from './events-hub.service';
import { ParticipantsUpdatedMessage } from '../shared/models/participants-updated-message';

@Injectable({
    providedIn: 'root'
})
export class EventsService {
    get handlersRegistered() {
        return this._handlersRegistered;
    }

    private get eventsHubConnection() {
        return this.eventsHubService.connection;
    }

    constructor(private logger: Logger, private eventsHubService: EventsHubService) {
        eventsHubService.onEventsHubReady.subscribe(() => this.start());
    }
    private participantStatusSubject = new Subject<ParticipantStatusMessage>();
    private endpointStatusSubject = new Subject<EndpointStatusMessage>();
    private hearingStatusSubject = new Subject<ConferenceStatusMessage>();
    private participantsUpdatedSubject = new Subject<ParticipantsUpdatedMessage>();

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
    private roomUpdateSubject = new Subject<Room>();
    private roomTransferSubject = new Subject<RoomTransfer>();

    private _handlersRegistered = false;

    private eventHandlers = {
        ParticipantStatusMessage: (participantId: string, username: string, conferenceId: string, status: ParticipantStatus) => {
            const message = new ParticipantStatusMessage(participantId, username, conferenceId, status);
            this.logger.debug('[EventsService] - ParticipantStatusMessage received', message);
            console.log('Faz - ParticipantStatusMessage', message);
            this.participantStatusSubject.next(message);
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
            console.log('Faz - RequestedConsultationMessage', message);
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
            console.log('Faz - ConsultationRequestResponseMessage', message);
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

        RoomUpdate: (payload: Room) => {
            this.logger.debug('[EventsService] - Room Update received: ', payload);
            console.log('Faz - RoomUpdate', payload);
            this.roomUpdateSubject.next(payload);
        },

        RoomTransfer: (payload: RoomTransfer) => {
            this.logger.debug('[EventsService] - Room Transfer received: ', payload);
            console.log('Faz - RoomTransfer', payload);
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
        }
    };

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

    get eventHubIsConnected(): boolean {
        return this.eventsHubService.isConnectedToHub;
    }

    onEventsHubReady(): Observable<any> {
        return this.eventsHubService.onEventsHubReady;
    }

    getServiceReconnected(): Observable<any> {
        return this.eventsHubService.getServiceReconnected();
    }

    getServiceDisconnected(): Observable<number> {
        return this.eventsHubService.getServiceDisconnected();
    }

    getParticipantStatusMessage(): Observable<ParticipantStatusMessage> {
        return this.participantStatusSubject.asObservable();
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

    getRoomUpdate(): Observable<Room> {
        return this.roomUpdateSubject.asObservable();
    }
    getRoomTransfer(): Observable<RoomTransfer> {
        return this.roomTransferSubject.asObservable();
    }

    getParticipantsUpdated(): Observable<ParticipantsUpdatedMessage> {
        return this.participantsUpdatedSubject.asObservable();
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

    async sendMediaStatus(conferenceId: string, participantId: string, mediaStatus: ParticipantMediaStatus) {
        await this.eventsHubConnection.send('SendMediaDeviceStatus', conferenceId, participantId, mediaStatus);
        this.logger.debug('[EventsService] - Sent device media status to EventHub', {
            conference: conferenceId,
            participant: participantId,
            mediaStatus: mediaStatus
        });
    }
}
