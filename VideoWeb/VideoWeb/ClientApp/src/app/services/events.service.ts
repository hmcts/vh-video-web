import { Injectable } from '@angular/core';
import * as signalR from '@aspnet/signalr';
import { AdalService } from 'adal-angular4';
import { Observable, Subject } from 'rxjs';
import { ConferenceStatus, ParticipantStatus, RoomType, ConsultationAnswer, ChatResponse } from './clients/api-client';
import { ConsultationMessage } from './models/consultation-message';
import { ConferenceStatusMessage } from './models/conference-status-message';
import { HelpMessage } from './models/help-message';
import { ParticipantStatusMessage } from './models/participant-status-message';
import { Logger } from './logging/logger-base';
import { AdminConsultationMessage } from './models/admin-consultation-message';

@Injectable({
    providedIn: 'root'
})
export class EventsService {
    connection: signalR.HubConnection;
    connectionStarted: boolean;
    attemptingConnection: boolean;
    private participantStatusSubject = new Subject<ParticipantStatusMessage>();
    private hearingStatusSubject = new Subject<ConferenceStatusMessage>();
    private helpMessageSubject = new Subject<HelpMessage>();
    private consultationMessageSubject = new Subject<ConsultationMessage>();
    private adminConsultationMessageSubject = new Subject<AdminConsultationMessage>();
    private messageSubject = new Subject<ChatResponse>();
    private adminAnsweredChatSubject = new Subject<string>();
    private eventHubDisconnectSubject = new Subject();
    private eventHubReconnectSubject = new Subject();

    constructor(private adalService: AdalService, private logger: Logger) {
        this.connectionStarted = false;
        this.connection = new signalR.HubConnectionBuilder()
            .configureLogging(signalR.LogLevel.Debug)
            .withAutomaticReconnect([0, 2000, 5000, 10000, 15000, 20000])
            .withUrl('/eventhub', {
                accessTokenFactory: () => this.adalService.userInfo.token
            })
            .build();
    }

    start() {
        if (!this.connectionStarted && !this.attemptingConnection) {
            this.attemptingConnection = true;
            this.connection
                .start()
                .then(() => {
                    this.connectionStarted = true;
                    this.attemptingConnection = false;
                    this.logger.info('Successfully connected to event hub');
                    this.connection.onreconnected(() => this.onEventHubReconnected());
                    this.connection.onclose(error => this.onEventHubErrorOrClose(error));
                })
                .catch(err => {
                    this.logger.error('Failed to connect to event hub', err);
                    this.onEventHubErrorOrClose(err);
                });
        }
    }

    private onEventHubReconnected() {
        this.eventHubReconnectSubject.next();
    }

    private onEventHubErrorOrClose(error: Error) {
        this.connectionStarted = false;
        this.attemptingConnection = false;
        if (error) {
            this.logger.error('EventHub connection closed', error);
            this.eventHubDisconnectSubject.next();
        }
    }

    getServiceReconnected(): Observable<any> {
        return this.eventHubReconnectSubject.asObservable();
    }

    getServiceDisconnected() {
        return this.eventHubDisconnectSubject.asObservable();
    }

    stop() {
        this.connection.stop().catch(err => this.logger.error('Failed to stop connection to event hub', err));
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

    getChatMessage(): Observable<ChatResponse> {
        this.connection.on('ReceiveMessage', (conferenceId: string, from: string, message: string, timestamp: Date) => {
            const date = new Date(timestamp);
            const chat = new ChatResponse({ from, message, timestamp: date });
            this.logger.event('ReceiveMessage received', chat);
            this.messageSubject.next(chat);
        });

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
}
