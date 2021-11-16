import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { ConferenceMessageAnswered } from './models/conference-message-answered';
import { Logger } from './logging/logger-base';

import { InstantMessage } from './models/instant-message';
import { ImEventsHubService } from './im-events-hub.service';

@Injectable({
    providedIn: 'root'
})
export class ImEventsService {
    get imHandlersRegistered() {
        return this._imHandlersRegistered;
    }

    private get imEventsHubConnection() {
        return this.imEventsHubService.connection;
    }

    constructor(private logger: Logger, private imEventsHubService: ImEventsHubService) {
        imEventsHubService.onImEventsHubReady.subscribe(() => this.start());
    }

    private messageSubject = new Subject<InstantMessage>();
    private adminAnsweredChatSubject = new Subject<ConferenceMessageAnswered>();

    private _imHandlersRegistered = false;

    private imEventHandlers = {
        ReceiveMessage: (conferenceId: string, from: string, to: string, message: string, timestamp: Date, messageUuid: string) => {
            const date = new Date(timestamp);
            const chat = new InstantMessage({ conferenceId, id: messageUuid, to, from, message, timestamp: date });
            this.logger.debug('[ImEventsService] - ReceiveMessage received', chat);
            this.messageSubject.next(chat);
        },

        AdminAnsweredChat: (conferenceId: string, participantId: string) => {
            const payload = new ConferenceMessageAnswered(conferenceId, participantId);
            this.logger.debug('[ImEventsService] - AdminAnsweredChat received', payload);
            this.adminAnsweredChatSubject.next(payload);
        }
    };

    start() {
        this.logger.info('[ImEventsService] - Start.');

        this.registerImHandlers();
    }

    stop() {
        this.deregisterImHandlers();
    }

    registerImHandlers(): void {
        if (this.imHandlersRegistered) {
            this.logger.warn('[ImEventsService] - Handlers already registered. Skipping registeration of handlers.');
            return;
        }

        for (const eventName in this.imEventHandlers) {
            if (this.imEventHandlers.hasOwnProperty(eventName)) {
                this.imEventsHubConnection.on(eventName, this.imEventHandlers[eventName]);
            }
        }

        this._imHandlersRegistered = true;
    }

    deregisterImHandlers(): void {
        if (!this.imHandlersRegistered) {
            this.logger.warn('[ImEventsService] - Handlers are not registered. Skipping deregisteration of handlers.');
            return;
        }

        for (const eventName in this.imEventHandlers) {
            if (this.imEventHandlers.hasOwnProperty(eventName)) {
                this.imEventsHubConnection.off(eventName, this.imEventHandlers[eventName]);
            }
        }

        this._imHandlersRegistered = false;
    }

    get imEventHubIsConnected(): boolean {
        return this.imEventsHubService.isConnectedToImHub;
    }

    onEventsHubReady(): Observable<any> {
        return this.imEventsHubService.onImEventsHubReady;
    }

    getServiceConnected(): Observable<any> {
        return this.imEventsHubService.getServiceConnected();
    }

    getServiceDisconnected(): Observable<number> {
        return this.imEventsHubService.getServiceDisconnected();
    }

    getChatMessage(): Observable<InstantMessage> {
        return this.messageSubject.asObservable();
    }

    getAdminAnsweredChat(): Observable<ConferenceMessageAnswered> {
        return this.adminAnsweredChatSubject.asObservable();
    }
  
    async sendMessage(instantMessage: InstantMessage) {
        this.logger.debug('[ImEventsService] - Sent message to EventHub', instantMessage);
        try {
            await this.imEventsHubConnection.send(
                'SendMessage',
                instantMessage.conferenceId,
                instantMessage.message,
                instantMessage.to,
                instantMessage.id
            );
        } catch (err) {
            this.logger.error(`[ImEventsService] - Unable to send im from ${instantMessage.from}`, err);
            throw err;
        }
    }
}
