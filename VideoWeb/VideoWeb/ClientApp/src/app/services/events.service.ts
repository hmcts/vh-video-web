import { Injectable } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { AdalService } from 'adal-angular4';
import { Observable, Subject } from 'rxjs';
import { Heartbeat } from '../shared/models/heartbeat';
import { ConfigService } from './api/config.service';
import { ErrorService } from 'src/app/services/error.service';
import { ConferenceStatus, ConsultationAnswer, EndpointStatus, ParticipantStatus, RoomType } from './clients/api-client';
import { Logger } from './logging/logger-base';
import { AdminConsultationMessage } from './models/admin-consultation-message';
import { ConferenceMessageAnswered } from './models/conference-message-answered';
import { ConferenceStatusMessage } from './models/conference-status-message';
import { ConsultationMessage } from './models/consultation-message';
import { EndpointStatusMessage } from './models/EndpointStatusMessage';
import { HelpMessage } from './models/help-message';
import { InstantMessage } from './models/instant-message';
import { HeartbeatHealth, ParticipantHeartbeat } from './models/participant-heartbeat';
import { ParticipantStatusMessage } from './models/participant-status-message';

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
    private consultationMessageSubject = new Subject<ConsultationMessage>();
    private adminConsultationMessageSubject = new Subject<AdminConsultationMessage>();
    private messageSubject = new Subject<InstantMessage>();
    private participantHeartbeat = new Subject<ParticipantHeartbeat>();
    private adminAnsweredChatSubject = new Subject<ConferenceMessageAnswered>();
    private eventHubDisconnectSubject = new Subject<number>();
    private eventHubReconnectSubject = new Subject();

    reconnectionAttempt: number;
    reconnectionPromise: Promise<any>;

    constructor(
        private adalService: AdalService,
        private configService: ConfigService,
        private logger: Logger,
        private errorService: ErrorService
    ) {
        this.reconnectionAttempt = 0;
        const eventhubPath = this.configService.getClientSettings().event_hub_path;
        this.connection = new signalR.HubConnectionBuilder()
            .configureLogging(signalR.LogLevel.Debug)
            .withAutomaticReconnect(this.reconnectionTimes)
            .withUrl(eventhubPath, {
                accessTokenFactory: () => this.adalService.userInfo.token
            })
            .build();
        this.connection.serverTimeoutInMilliseconds = this.serverTimeoutTime;
    }

    start() {
        if (this.reconnectionPromise) {
            return this.reconnectionPromise;
        }

        if (!this.isConnectedToHub) {
            this.reconnectionAttempt++;
            return this.connection
                .start()
                .then(() => {
                    this.reconnectionAttempt = 0;
                    this.logger.info('[EventsService] - Successfully connected to EventHub');
                    this.connection.onreconnecting(error => this.onEventHubReconnecting(error));
                    this.connection.onreconnected(() => this.onEventHubReconnected());
                    this.connection.onclose(error => this.onEventHubErrorOrClose(error));
                    this.registerHandlers();
                })
                .catch(async err => {
                    this.logger.warn(`[EventsService] - Failed to connect to EventHub ${err}`);
                    this.onEventHubErrorOrClose(err);
                    if (this.reconnectionTimes.length >= this.reconnectionAttempt) {
                        const delayMs = this.reconnectionTimes[this.reconnectionAttempt - 1];
                        this.logger.info(`EventHub reconnecting in ${delayMs}ms`);
                        this.reconnectionPromise = this.delay(delayMs).then(() => {
                            this.reconnectionPromise = null;
                            this.start();
                        });
                    } else {
                        this.logger.info(
                            `EventHub failed to connect too many times (#${this.reconnectionAttempt}), going to service error`
                        );
                        this.errorService.goToServiceError('Your connection was lost');
                    }
                });
        }
    }

    get isConnectedToHub(): boolean {
        return (
            this.connection.state === signalR.HubConnectionState.Connected ||
            this.connection.state === signalR.HubConnectionState.Connecting ||
            this.connection.state === signalR.HubConnectionState.Reconnecting
        );
    }

    registerHandlers(): void {
        this.connection.on(
            'ParticipantStatusMessage',
            (participantId: string, username: string, conferenceId: string, status: ParticipantStatus) => {
                const message = new ParticipantStatusMessage(participantId, username, conferenceId, status);
                this.logger.debug('[EventsService] - ParticipantStatusMessage received', message);
                this.participantStatusSubject.next(message);
            }
        );

        this.connection.on('EndpointStatusMessage', (endpointId: string, conferenceId: string, status: EndpointStatus) => {
            const message = new EndpointStatusMessage(endpointId, conferenceId, status);
            this.logger.debug('[EventsService] - EndpointStatusMessage received', message);
            this.endpointStatusSubject.next(message);
        });

        this.connection.on('ConferenceStatusMessage', (conferenceId: string, status: ConferenceStatus) => {
            const message = new ConferenceStatusMessage(conferenceId, status);
            this.logger.debug('[EventsService] - ConferenceStatusMessage received', message);
            this.hearingStatusSubject.next(message);
        });

        this.connection.on('CountdownFinished', (conferenceId: string) => {
            this.logger.debug('[EventsService] - CountdownFinished received', conferenceId);
            this.hearingCountdownCompleteSubject.next(conferenceId);
        });

        this.connection.on('HelpMessage', (conferenceId: string, participantName: string) => {
            const message = new HelpMessage(conferenceId, participantName);
            this.logger.debug('[EventsService] - HelpMessage received', message);
            this.helpMessageSubject.next(message);
        });

        this.connection.on(
            'ConsultationMessage',
            (conferenceId: string, requestedBy: string, requestedFor: string, result?: ConsultationAnswer) => {
                const message = new ConsultationMessage(conferenceId, requestedBy, requestedFor, result);
                this.logger.debug('[EventsService] - ConsultationMessage received', message);
                this.consultationMessageSubject.next(message);
            }
        );

        this.connection.on(
            'AdminConsultationMessage',
            (conferenceId: string, roomType: RoomType, requestedFor: string, answer: ConsultationAnswer) => {
                const message = new AdminConsultationMessage(conferenceId, roomType, requestedFor, answer);
                this.logger.debug('[EventsService] - AdminConsultationMessage received', message);
                this.adminConsultationMessageSubject.next(message);
            }
        );

        this.connection.on(
            'ReceiveMessage',
            (conferenceId: string, from: string, to: string, message: string, timestamp: Date, messageUuid: string) => {
                const date = new Date(timestamp);
                const chat = new InstantMessage({ conferenceId, id: messageUuid, to, from, message, timestamp: date });
                this.logger.debug('[EventsService] - ReceiveMessage received', chat);
                this.messageSubject.next(chat);
            }
        );

        this.connection.on('AdminAnsweredChat', (conferenceId: string, participantUsername: string) => {
            const payload = new ConferenceMessageAnswered(conferenceId, participantUsername);
            this.logger.debug('[EventsService] - AdminAnsweredChat received', payload);
            this.adminAnsweredChatSubject.next(payload);
        });

        this.connection.on(
            'ReceiveHeartbeat',
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
        );
    }

    stop() {
        this.logger.debug('[EventsService] - Ending connection to EventHub');
        this.connection.stop().catch(err => this.logger.error('[EventsService] - Failed to stop connection to EventHub', err));
    }

    async delay(ms: number) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

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

    getConsultationMessage(): Observable<ConsultationMessage> {
        return this.consultationMessageSubject.asObservable();
    }

    getAdminConsultationMessage(): Observable<AdminConsultationMessage> {
        return this.adminConsultationMessageSubject.asObservable();
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
}
