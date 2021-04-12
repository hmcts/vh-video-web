import { Injectable } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { Observable, Subject } from 'rxjs';
import { ErrorService } from 'src/app/services/error.service';
import { Heartbeat } from '../shared/models/heartbeat';
import { Room } from '../shared/models/room';
import { ParticipantMediaStatus } from '../shared/models/participant-media-status';
import { ParticipantMediaStatusMessage } from '../shared/models/participant-media-status-message';
import { ConfigService } from './api/config.service';
import { ConferenceMessageAnswered } from './models/conference-message-answered';
import { ConferenceStatus, ConsultationAnswer, EndpointStatus, ParticipantStatus } from './clients/api-client';
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
import { OidcSecurityService } from 'angular-auth-oidc-client';
import { ConnectionStatusService } from './connection-status.service';

@Injectable({
    providedIn: 'root'
})
export class EventsService {
    serverTimeoutTime = 300000; // 5 minutes
    reconnectionTimes = [0, 2000, 5000, 10000, 15000, 20000, 30000];
    connection: signalR.HubConnection;

    private participantStatusSubject = new Subject<ParticipantStatusMessage>();
    private endpointStatusSubject = new Subject<EndpointStatusMessage>();
    private hearingStatusSubject = new Subject<ConferenceStatusMessage>();
    private hearingCountdownCompleteSubject = new Subject<string>();
    private helpMessageSubject = new Subject<HelpMessage>();

    private requestedConsultationMessageSubject = new Subject<RequestedConsultationMessage>();
    private consultationRequestResponseMessageSubject = new Subject<ConsultationRequestResponseMessage>();

    private messageSubject = new Subject<InstantMessage>();
    private adminAnsweredChatSubject = new Subject<ConferenceMessageAnswered>();
    private participantHeartbeat = new Subject<ParticipantHeartbeat>();
    private eventHubDisconnectSubject = new Subject<number>();
    private eventHubReconnectSubject = new Subject();
    private hearingTransferSubject = new Subject<HearingTransfer>();
    private participantMediaStatusSubject = new Subject<ParticipantMediaStatusMessage>();
    private participantRemoteMuteStatusSubject = new Subject<ParticipantRemoteMuteMessage>();
    private participantHandRaisedStatusSubject = new Subject<ParticipantHandRaisedMessage>();
    private roomUpdateSubject = new Subject<Room>();
    private roomTransferSubject = new Subject<RoomTransfer>();
    private handlersRegistered = false;

    reconnectionAttempt: number;
    reconnectionPromise: Promise<any>;

    constructor(
        private oidcSecurityService: OidcSecurityService,
        private configService: ConfigService,
        private logger: Logger,
        private errorService: ErrorService,
        connectionStatusService : ConnectionStatusService
    ) {
        this.reconnectionAttempt = 0;
        this.configService.getClientSettings().subscribe(configSettings => {
            this.buildConnection(configSettings.event_hub_path);
        });

        connectionStatusService.onConnectionStatusChange().subscribe((connected) => {
            if (connected) {
                this.logger.info('[EventsService] - Connection status changed: connected.')
                this.start();
            } else {
                this.logger.info('[EventsService] - Connection status changed: disconnected.')
                this.stop();
            }
        })
    }

    private buildConnection(eventHubPath : string) {
        this.connection = new signalR.HubConnectionBuilder()
        .configureLogging(signalR.LogLevel.Debug)
        .withAutomaticReconnect(this.reconnectionTimes)
        .withUrl(eventHubPath, {
            accessTokenFactory: () => this.oidcSecurityService.getToken()
        })
        .build();

        this.connection.serverTimeoutInMilliseconds = this.serverTimeoutTime;
        this.connection.onreconnecting(error => this.onEventHubReconnecting(error));
        this.connection.onreconnected(() => this.onEventHubReconnected());
        this.connection.onclose(error => this.onEventHubErrorOrClose(error));
        this.registerHandlers();
    }

    start() {
        if (this.reconnectionPromise) {
            this.logger.info("[EventsService] - A reconnection promise already exists")
            return;
        }

        if (!this.isConnectedToHub && this.connection.state !== signalR.HubConnectionState.Disconnecting) {
            this.oidcSecurityService.isAuthenticated$.subscribe(authenticated => {
                if (authenticated) {
                    this.reconnectionAttempt++;
                    return this.connection
                        .start()
                        .then(() => {
                            this.reconnectionAttempt = 0;
                            this.logger.info('[EventsService] - Successfully connected to EventHub');
                        })
                        .catch(async err => {
                            this.logger.warn(`[EventsService] - Failed to connect to EventHub ${err}`);
                            this.onEventHubErrorOrClose(err);
                            if (this.reconnectionTimes.length >= this.reconnectionAttempt) {
                                const delayMs = this.reconnectionTimes[this.reconnectionAttempt - 1];
                                this.logger.info(`[EventsService] - Reconnecting in ${delayMs}ms`);
                                this.reconnectionPromise = this.delay(delayMs).then(() => {
                                    this.reconnectionPromise = null;
                                    this.start();
                                });
                            } else {
                                this.logger.info(
                                    `[EventsService] - Failed to connect too many times (#${this.reconnectionAttempt}), going to service error`
                                );
                                this.errorService.goToServiceError('Your connection was lost');
                            }
                        });
                }
            });
        }
    }

    registerHandlers(): void {
        if (this.handlersRegistered) {
            this.logger.warn('[EventsService] - Handlers already registered. Skipping registeration of handlers.');
            return;
        }

        for (const eventName in this.eventHandlers)
            this.connection.on(eventName, this.eventHandlers[eventName]);

        this.handlersRegistered = true;
    }

    deregisterHandlers(): void {
        if (!this.handlersRegistered) {
            this.logger.warn('[EventsService] - Handlers are not registered. Skipping deregisteration of handlers.');
            return;
        }

        for (const eventName in this.eventHandlers)
            this.connection.off(eventName, this.eventHandlers[eventName]);

        this.handlersRegistered = false;
    }

    stop() {
        if (!this.isDisconnectedFromHub) {
            this.logger.debug(`[EventsService] - Ending connection to EventHub. Current state: ${this.connection.state}`);
            this.connection
                .stop()
                .then(() => {
                    this.logger.debug(`[EventsService] - Connection stopped, new state: ${this.connection.state}`);
                })
                .catch(err => this.logger.error('[EventsService] - Failed to stop connection to EventHub', err));
        }
    }

    get isConnectedToHub(): boolean {
        return (
            this.connection.state === signalR.HubConnectionState.Connected ||
            this.connection.state === signalR.HubConnectionState.Connecting ||
            this.connection.state === signalR.HubConnectionState.Reconnecting
        );
    }

    get isDisconnectedFromHub(): boolean {
        return (
            this.connection.state === signalR.HubConnectionState.Disconnected ||
            this.connection.state === signalR.HubConnectionState.Disconnecting
        );
    }

    private async delay(ms: number) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    ///////////////////////////////////
    private onEventHubReconnecting(error: Error) {
        this.reconnectionAttempt++;
        this.logger.info('[EventsService] - Attempting to reconnect to EventHub: attempt #' + this.reconnectionAttempt);
        if (error) {
            this.logger.error('[EventsService] - Error during reconnect to EventHub', error);
            this.eventHubDisconnectSubject.next(this.reconnectionAttempt);
        }
    }

    private onEventHubReconnected() {
        this.logger.info('[EventsService] - Successfully reconnected to EventHub');
        this.reconnectionAttempt = 0;
        this.eventHubReconnectSubject.next();
    }

    private onEventHubErrorOrClose(error: Error) {
        const message = error ? 'EventHub connection error' : 'EventHub connection closed';
        this.logger.error(`[EventsService] - ${message}`, error);
        this.eventHubDisconnectSubject.next(this.reconnectionAttempt);
    }
    ////////////////////////////////

    getServiceReconnected(): Observable<any> {
        return this.eventHubReconnectSubject.asObservable();
    }

    getServiceDisconnected(): Observable<number> {
        return this.eventHubDisconnectSubject.asObservable();
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

    async sendMessage(instantMessage: InstantMessage) {
        try {
            await this.connection.send(
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
        await this.connection.send('SendHeartbeat', conferenceId, participantId, heartbeat);
        this.logger.debug('[EventsService] - Sent heartbeat to EventHub', heartbeat);
    }

    async sendTransferRequest(conferenceId: string, participantId: string, transferDirection: TransferDirection) {
        await this.connection.send('sendTransferRequest', conferenceId, participantId, transferDirection);
        this.logger.debug('[EventsService] - Sent transfer request to EventHub', transferDirection);
    }

    async publishRemoteMuteStatus(conferenceId: string, participantId: string, isRemoteMuted: boolean) {
        await this.connection.send('UpdateParticipantRemoteMuteStatus', conferenceId, participantId, isRemoteMuted);
        this.logger.debug('[EventsService] - Sent update remote mute status request to EventHub', {
            conference: conferenceId,
            participant: participantId,
            isRemoteMuted
        });
    }

    async publishParticipantHandRaisedStatus(conferenceId: string, participantId: string, isRaised: boolean) {
        await this.connection.send('UpdateParticipantHandStatus', conferenceId, participantId, isRaised);
        this.logger.debug('[EventsService] - Sent update hand raised status request to EventHub', {
            conference: conferenceId,
            participant: participantId,
            isRaised
        });
    }

    async sendMediaStatus(conferenceId: string, participantId: string, mediaStatus: ParticipantMediaStatus) {
        await this.connection.send('SendMediaDeviceStatus', conferenceId, participantId, mediaStatus);
        this.logger.debug('[EventsService] - Sent device media status to EventHub', {
            conference: conferenceId,
            participant: participantId,
            mediaStatus: mediaStatus
        });
    }

    private eventHandlers = {
        'ParticipantStatusMessage' :
        (participantId: string, username: string, conferenceId: string, status: ParticipantStatus) => {
            const message = new ParticipantStatusMessage(participantId, username, conferenceId, status);
            this.logger.debug('[EventsService] - ParticipantStatusMessage received', message);
            this.participantStatusSubject.next(message);
        },

        'EndpointStatusMessage' :
        (endpointId: string, conferenceId: string, status: EndpointStatus) => {
            const message = new EndpointStatusMessage(endpointId, conferenceId, status);
            this.logger.debug('[EventsService] - EndpointStatusMessage received', message);
            this.endpointStatusSubject.next(message);
        },

        'ConferenceStatusMessage' :
        (conferenceId: string, status: ConferenceStatus) => {
            const message = new ConferenceStatusMessage(conferenceId, status);
            this.logger.debug('[EventsService] - ConferenceStatusMessage received', message);
            this.hearingStatusSubject.next(message);
        },

        'CountdownFinished' :
        (conferenceId: string) => {
            this.logger.debug('[EventsService] - CountdownFinished received', conferenceId);
            this.hearingCountdownCompleteSubject.next(conferenceId);
        },

        'HelpMessage' :
        (conferenceId: string, participantName: string) => {
            const message = new HelpMessage(conferenceId, participantName);
            this.logger.debug('[EventsService] - HelpMessage received', message);
            this.helpMessageSubject.next(message);
        },

        'RequestedConsultationMessage' :
        (conferenceId: string, roomLabel: string, requestedBy: string, requestedFor: string) => {
            const message = new RequestedConsultationMessage(conferenceId, roomLabel, requestedBy, requestedFor);
            this.logger.debug('[EventsService] - RequestConsultationMessage received', message);
            this.requestedConsultationMessageSubject.next(message);
        },

        'ConsultationRequestResponseMessage' :
        (conferenceId: string, roomLabel: string, requestedFor: string, answer: ConsultationAnswer) => {
            const message = new ConsultationRequestResponseMessage(conferenceId, roomLabel, requestedFor, answer);
            this.logger.debug('[EventsService] - ConsultationRequestResponseMessage received', message);
            this.consultationRequestResponseMessageSubject.next(message);
        },

        'ReceiveMessage' :
        (conferenceId: string, from: string, to: string, message: string, timestamp: Date, messageUuid: string) => {
            const date = new Date(timestamp);
            const chat = new InstantMessage({ conferenceId, id: messageUuid, to, from, message, timestamp: date });
            this.logger.debug('[EventsService] - ReceiveMessage received', chat);
            this.messageSubject.next(chat);
        },

        'AdminAnsweredChat' :
        (conferenceId: string, participantId: string) => {
            const payload = new ConferenceMessageAnswered(conferenceId, participantId);
            this.logger.debug('[EventsService] - AdminAnsweredChat received', payload);
            this.adminAnsweredChatSubject.next(payload);
        },

        'HearingTransfer' :
        (conferenceId: string, participantId: string, hearingPosition: TransferDirection) => {
            const payload = new HearingTransfer(conferenceId, participantId, hearingPosition);
            this.logger.debug('[EventsService] - HearingTransfer received: ', payload);
            this.hearingTransferSubject.next(payload);
        },

        'ParticipantMediaStatusMessage' :
        (participantId: string, conferenceId: string, mediaStatus: ParticipantMediaStatus) => {
            const payload = new ParticipantMediaStatusMessage(conferenceId, participantId, mediaStatus);
            this.logger.debug('[EventsService] - Participant Media Status change received: ', payload);
            this.participantMediaStatusSubject.next(payload);
        },

        'ParticipantRemoteMuteMessage' :
        (participantId: string, conferenceId: string, isRemoteMuted: boolean) => {
            this.logger.debug('[EventsService] - Participant Remote mute status change received: ', {
                participantId,
                conferenceId,
                isRemoteMuted
            });
            const payload = new ParticipantRemoteMuteMessage(conferenceId, participantId, isRemoteMuted);
            this.participantRemoteMuteStatusSubject.next(payload);
        },

        'ParticipantHandRaiseMessage' :
        (participantId: string, conferenceId: string, hasHandRaised: boolean) => {
            this.logger.debug('[EventsService] - Participant Hand raised status change received: ', {
                participantId,
                conferenceId,
                hasHandRaised
            });
            const payload = new ParticipantHandRaisedMessage(conferenceId, participantId, hasHandRaised);
            this.participantHandRaisedStatusSubject.next(payload);
        },

        'RoomUpdate' :
        (payload: Room) => {
            this.logger.debug('[EventsService] - Room Update received: ', payload);
            this.roomUpdateSubject.next(payload);
        },

        'RoomTransfer' :
        (payload: RoomTransfer) => {
            this.logger.debug('[EventsService] - Room Transfer received: ', payload);
            this.roomTransferSubject.next(payload);
        },


        'ReceiveHeartbeat' :
        (
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
}
