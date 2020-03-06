import { Injectable } from '@angular/core';
import * as signalR from '@aspnet/signalr';
import { AdalService } from 'adal-angular4';
import { Observable, Subject } from 'rxjs';
import { ConferenceStatus, ConsultationAnswer, ParticipantStatus, RoomType } from './clients/api-client';
import { Logger } from './logging/logger-base';
import { AdminConsultationMessage } from './models/admin-consultation-message';
import { ConferenceStatusMessage } from './models/conference-status-message';
import { ConsultationMessage } from './models/consultation-message';
import { HelpMessage } from './models/help-message';
import { InstantMessage } from './models/instant-message';
import { ParticipantStatusMessage } from './models/participant-status-message';
import { HeartbeatHealth, ParticipantHeartbeat } from './models/participant-heartbeat';
import { Heartbeat } from '../shared/models/heartbeat';

@Injectable({
    providedIn: 'root'
})
export class EventsService {
    waitTimeBase = 1000;
    connection: signalR.HubConnection;
    connectionStarted: boolean;
    attemptingConnection: boolean;
    private participantStatusSubject = new Subject<ParticipantStatusMessage>();
    private hearingStatusSubject = new Subject<ConferenceStatusMessage>();
    private helpMessageSubject = new Subject<HelpMessage>();
    private consultationMessageSubject = new Subject<ConsultationMessage>();
    private adminConsultationMessageSubject = new Subject<AdminConsultationMessage>();
    private messageSubject = new Subject<InstantMessage>();
    private participantHeartbeat = new Subject<ParticipantHeartbeat>();
    private adminAnsweredChatSubject = new Subject<string>();
    private eventHubDisconnectSubject = new Subject<number>();
    private eventHubReconnectSubject = new Subject();

    reconnectionAttempt: number;

    constructor(private adalService: AdalService, private logger: Logger) {
        this.reconnectionAttempt = 0;
        this.connectionStarted = false;
        this.connection = new signalR.HubConnectionBuilder()
            .configureLogging(signalR.LogLevel.Debug)
            .withAutomaticReconnect([0, 2000, 5000, 10000, 15000, 20000, 30000])
            .withUrl('/eventhub', {
                accessTokenFactory: () => this.adalService.userInfo.token
            })
            .build();
    }

    start() {
        if (!this.connectionStarted && !this.attemptingConnection) {
            this.reconnectionAttempt++;
            this.attemptingConnection = true;
            return this.connection
                .start()
                .then(
                    () => {
                        this.reconnectionAttempt = 0;
                        this.connectionStarted = true;
                        this.attemptingConnection = false;
                        this.logger.info('Successfully connected to EventHub');
                        this.connection.onreconnecting(error => this.onEventHubReconnecting(error));
                        this.connection.onreconnected(() => this.onEventHubReconnected());
                        this.connection.onclose(error => this.onEventHubErrorOrClose(error));
                    },
                    async rejectReason => {
                        this.attemptingConnection = false;
                        this.onEventHubErrorOrClose(rejectReason);
                        if (this.reconnectionAttempt < 6) {
                            const waitTime = this.reconnectionAttempt * this.waitTimeBase;
                            this.logger.info(`Waiting ${waitTime / 1000} seconds before attempting to reconnect to EventHub`);
                            await this.delay(waitTime);
                            this.logger.info(`Attempting to reconnect to EventHub: attempt #${this.reconnectionAttempt}`);
                            this.start();
                        } else {
                            this.logger.info(`Exceeded reconnection attempts to EventHub - attempt #${this.reconnectionAttempt}`);
                        }
                    }
                )
                .catch(err => {
                    this.logger.error('Failed to connect to EventHub', err);
                    this.onEventHubErrorOrClose(err);
                });
        }
    }

    async delay(ms: number) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    private onEventHubReconnecting(error: Error) {
        this.reconnectionAttempt++;
        this.logger.info('Attempting to reconnect to EventHub: attempt #' + this.reconnectionAttempt);
        if (error) {
            this.logger.error('Error during reconnect to EventHub', error);
            this.connectionStarted = false;
            this.attemptingConnection = false;
            this.eventHubDisconnectSubject.next(this.reconnectionAttempt);
        }
    }

    private onEventHubReconnected() {
        this.logger.info('Successfully reconnected to EventHub');
        this.reconnectionAttempt = 0;
        this.eventHubReconnectSubject.next();
    }

    private onEventHubErrorOrClose(error: Error) {
        const message = error ? 'EventHub connection closed' : 'EventHub connection error';
        this.logger.error(message, error);
        this.connectionStarted = false;
        this.attemptingConnection = false;
        this.eventHubDisconnectSubject.next(this.reconnectionAttempt);
    }

    getServiceReconnected(): Observable<any> {
        return this.eventHubReconnectSubject.asObservable();
    }

    getServiceDisconnected(): Observable<number> {
        return this.eventHubDisconnectSubject.asObservable();
    }

    stop() {
        this.connection.stop().catch(err => this.logger.error('Failed to stop connection to EventHub', err));
    }

    getParticipantStatusMessage(): Observable<ParticipantStatusMessage> {
        this.connection.on('ParticipantStatusMessage', (participantId: string, status: ParticipantStatus) => {
            const message = new ParticipantStatusMessage(participantId, status);
            this.logger.event('ParticipantStatusMessage received', message);
            this.participantStatusSubject.next(message);
        });

        return this.participantStatusSubject.asObservable();
    }

    getHearingStatusMessage(): Observable<ConferenceStatusMessage> {
        this.connection.on('ConferenceStatusMessage', (conferenceId: string, status: ConferenceStatus) => {
            const message = new ConferenceStatusMessage(conferenceId, status);
            this.logger.event('ConferenceStatusMessage received', message);
            this.hearingStatusSubject.next(message);
        });

        return this.hearingStatusSubject.asObservable();
    }

    getHelpMessage(): Observable<HelpMessage> {
        this.connection.on('HelpMessage', (conferenceId: string, participantName: string) => {
            const message = new HelpMessage(conferenceId, participantName);
            this.logger.event('HelpMessage received', message);
            this.helpMessageSubject.next(message);
        });

        return this.helpMessageSubject.asObservable();
    }

    getConsultationMessage(): Observable<ConsultationMessage> {
        this.connection.on('ConsultationMessage', (conferenceId: string, requestedBy: string, requestedFor: string, result: string) => {
            const message = new ConsultationMessage(conferenceId, requestedBy, requestedFor, result);
            this.logger.event('ConsultationMessage received', message);
            this.consultationMessageSubject.next(message);
        });

        return this.consultationMessageSubject.asObservable();
    }

    getAdminConsultationMessage(): Observable<AdminConsultationMessage> {
        this.connection.on(
            'AdminConsultationMessage',
            (conferenceId: string, roomType: RoomType, requestedFor: string, answer: ConsultationAnswer) => {
                const message = new AdminConsultationMessage(conferenceId, roomType, requestedFor, answer);
                this.logger.event('AdminConsultationMessage received', message);
                this.adminConsultationMessageSubject.next(message);
            }
        );

        return this.adminConsultationMessageSubject.asObservable();
    }

    getChatMessage(): Observable<InstantMessage> {
        this.connection.on(
            'ReceiveMessage',
            (conferenceId: string, from: string, message: string, timestamp: Date, messageUuid: string) => {
                const date = new Date(timestamp);
                const chat = new InstantMessage({ conferenceId, id: messageUuid, from, message, timestamp: date });
                this.logger.event('ReceiveMessage received', chat);
                this.messageSubject.next(chat);
            }
        );

        return this.messageSubject.asObservable();
    }

    getAdminAnsweredChat(): Observable<string> {
        this.connection.on('AdminAnsweredChat', (conferenceId: string) => {
            this.logger.event('AdminAnsweredChat received', conferenceId);
            this.adminAnsweredChatSubject.next(conferenceId);
        });

        return this.adminAnsweredChatSubject.asObservable();
    }

    async sendMessage(conferenceId: string, message: string) {
        await this.connection.send('SendMessage', conferenceId, message);
    }

    async sendHeartbeat(conferenceId: string, participantId: string, heartbeat: Heartbeat) {
      await this.connection.send('SendHeartbeat', conferenceId, participantId, heartbeat);
    }

    getHeartbeat(): Observable<ParticipantHeartbeat> {
      this.connection.on(
        'ReceiveHeartbeat',
        (conferenceId: string, participantId: string, heartbeatHealth: HeartbeatHealth,
         browserName: string, browserVersion: string) => {
          const heartbeat = new ParticipantHeartbeat(conferenceId, participantId, heartbeatHealth, browserName, browserVersion);
          this.logger.event('ReceiveHeartbeat received', heartbeat);
          this.participantHeartbeat.next(heartbeat);
        }
      );

      return this.participantHeartbeat.asObservable();
    }
}
