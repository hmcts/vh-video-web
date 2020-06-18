import { Injectable } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { AdalService } from 'adal-angular4';
import { Observable, Subject } from 'rxjs';
import { Heartbeat } from '../shared/models/heartbeat';
import { ConferenceStatus, ConsultationAnswer, ParticipantStatus, RoomType } from './clients/api-client';
import { Logger } from './logging/logger-base';
import { AdminConsultationMessage } from './models/admin-consultation-message';
import { ConferenceMessageAnswered } from './models/conference-message-answered';
import { ConferenceStatusMessage } from './models/conference-status-message';
import { ConsultationMessage } from './models/consultation-message';
import { HelpMessage } from './models/help-message';
import { InstantMessage } from './models/instant-message';
import { HeartbeatHealth, ParticipantHeartbeat } from './models/participant-heartbeat';
import { ParticipantStatusMessage } from './models/participant-status-message';

@Injectable({
    providedIn: 'root'
})
export class EventsService {
    retryDelayTime = 5000;
    connection: signalR.HubConnection;

    private participantStatusSubject = new Subject<ParticipantStatusMessage>();
    private hearingStatusSubject = new Subject<ConferenceStatusMessage>();
    private helpMessageSubject = new Subject<HelpMessage>();
    private consultationMessageSubject = new Subject<ConsultationMessage>();
    private adminConsultationMessageSubject = new Subject<AdminConsultationMessage>();
    private messageSubject = new Subject<InstantMessage>();
    private participantHeartbeat = new Subject<ParticipantHeartbeat>();
    private adminAnsweredChatSubject = new Subject<ConferenceMessageAnswered>();
    private eventHubDisconnectSubject = new Subject<number>();
    private eventHubReconnectSubject = new Subject();

    reconnectionAttempt: number;

    constructor(private adalService: AdalService, private logger: Logger) {
        this.reconnectionAttempt = 0;
        this.connection = new signalR.HubConnectionBuilder()
            .configureLogging(signalR.LogLevel.Debug)
            .withAutomaticReconnect([0, 2000, 5000, 10000, 15000, 20000, 30000])
            .withUrl('/eventhub', {
                accessTokenFactory: () => this.adalService.userInfo.token
            })
            .build();
    }

    start() {
        if (!this.isConnectedToHub) {
            this.reconnectionAttempt++;
            return this.connection
                .start()
                .then(() => {
                    this.reconnectionAttempt = 0;
                    this.logger.info('Successfully connected to EventHub');
                    this.connection.onreconnecting(error => this.onEventHubReconnecting(error));
                    this.connection.onreconnected(() => this.onEventHubReconnected());
                    this.connection.onclose(error => this.onEventHubErrorOrClose(error));
                    this.registerHandlers();
                })
                .catch(async err => {
                    this.logger.warn(`Failed to connect to EventHub ${err}`);
                    this.onEventHubErrorOrClose(err);
                    await this.delay(this.retryDelayTime);
                    this.start();
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
                this.logger.event('ParticipantStatusMessage received', message);
                this.participantStatusSubject.next(message);
            }
        );

        this.connection.on('ConferenceStatusMessage', (conferenceId: string, status: ConferenceStatus) => {
            const message = new ConferenceStatusMessage(conferenceId, status);
            this.logger.event('ConferenceStatusMessage received', message);
            this.hearingStatusSubject.next(message);
        });

        this.connection.on('HelpMessage', (conferenceId: string, participantName: string) => {
            const message = new HelpMessage(conferenceId, participantName);
            this.logger.event('HelpMessage received', message);
            this.helpMessageSubject.next(message);
        });

        this.connection.on(
            'ConsultationMessage',
            (conferenceId: string, requestedBy: string, requestedFor: string, result?: ConsultationAnswer) => {
                const message = new ConsultationMessage(conferenceId, requestedBy, requestedFor, result);
                this.logger.event('ConsultationMessage received', message);
                this.consultationMessageSubject.next(message);
            }
        );

        this.connection.on(
            'AdminConsultationMessage',
            (conferenceId: string, roomType: RoomType, requestedFor: string, answer: ConsultationAnswer) => {
                const message = new AdminConsultationMessage(conferenceId, roomType, requestedFor, answer);
                this.logger.event('AdminConsultationMessage received', message);
                this.adminConsultationMessageSubject.next(message);
            }
        );

        this.connection.on(
            'ReceiveMessage',
            (conferenceId: string, from: string, to: string, message: string, timestamp: Date, messageUuid: string) => {
                const date = new Date(timestamp);
                const chat = new InstantMessage({ conferenceId, id: messageUuid, to, from, message, timestamp: date });
                this.logger.event('ReceiveMessage received', chat);
                this.messageSubject.next(chat);
            }
        );

        this.connection.on('AdminAnsweredChat', (conferenceId: string, participantUsername: string) => {
            const payload = new ConferenceMessageAnswered(conferenceId, participantUsername);
            this.logger.event('AdminAnsweredChat received', payload);
            this.adminAnsweredChatSubject.next(payload);
        });

        this.connection.on(
            'ReceiveHeartbeat',
            (
                conferenceId: string,
                participantId: string,
                heartbeatHealth: HeartbeatHealth,
                browserName: string,
                browserVersion: string
            ) => {
                const heartbeat = new ParticipantHeartbeat(conferenceId, participantId, heartbeatHealth, browserName, browserVersion);
                this.logger.event('ReceiveHeartbeat received', heartbeat);
                this.participantHeartbeat.next(heartbeat);
            }
        );
    }

    stop() {
        this.connection.stop().catch(err => this.logger.error('Failed to stop connection to EventHub', err));
    }

    async delay(ms: number) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    private onEventHubReconnecting(error: Error) {
        this.reconnectionAttempt++;
        this.logger.info('Attempting to reconnect to EventHub: attempt #' + this.reconnectionAttempt);
        if (error) {
            this.logger.error('Error during reconnect to EventHub', error);
            this.eventHubDisconnectSubject.next(this.reconnectionAttempt);
        }
    }

    private onEventHubReconnected() {
        this.logger.info('Successfully reconnected to EventHub');
        this.reconnectionAttempt = 0;
        this.eventHubReconnectSubject.next();
    }

    private onEventHubErrorOrClose(error: Error) {
        const message = error ? 'EventHub connection error' : 'EventHub connection closed';
        this.logger.error(message, error);
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
            this.logger.error(`Unable to send im from ${instantMessage.from}`, err);
            throw err;
        }
    }

    async sendHeartbeat(conferenceId: string, participantId: string, heartbeat: Heartbeat) {
        await this.connection.send('SendHeartbeat', conferenceId, participantId, heartbeat);
    }
}
