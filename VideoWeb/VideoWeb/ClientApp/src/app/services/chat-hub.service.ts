import { Injectable } from '@angular/core';
import * as signalR from '@aspnet/signalr';
import { Subject, Observable } from 'rxjs';
import { ChatHubMessage } from './models/chat-hub-message';
import { AdalService } from 'adal-angular4';
import { Logger } from './logging/logger-base';

@Injectable({
    providedIn: 'root'
})
export class ChatHubService {
    connection: signalR.HubConnection;
    connectionStarted: boolean;
    attemptingConnection: boolean;

    private messageSubject = new Subject<ChatHubMessage>();

    private chatHubDisconnectSubject = new Subject();
    private chatHubReconnectSubject = new Subject();

    constructor(private adalService: AdalService, private logger: Logger) {
        this.connectionStarted = false;
        this.connection = new signalR.HubConnectionBuilder()
            .configureLogging(signalR.LogLevel.Debug)
            .withAutomaticReconnect([0, 2000, 5000, 10000, 15000, 20000])
            .withUrl('/chathub', {
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
                    this.logger.info('Successfully connected to chat hub');
                    this.connection.onreconnected(() => this.onChatHubReconnected());
                    this.connection.onclose(error => this.onChatHubErrorOrClose(error));
                })
                .catch(err => {
                    this.logger.error('Failed to connect to chat hub', err);
                    this.onChatHubErrorOrClose(err);
                });
        }
    }

    stop() {
        this.connection.stop().catch(err => this.logger.error('Failed to stop connection to chat hub', err));
    }

    private onChatHubReconnected() {
        this.chatHubReconnectSubject.next();
    }

    private onChatHubErrorOrClose(error: Error) {
        this.connectionStarted = false;
        this.attemptingConnection = false;
        if (error) {
            this.logger.error('ChatHub connection closed', error);
            this.chatHubDisconnectSubject.next();
        }
    }

    getServiceReconnected() {
        return this.chatHubReconnectSubject.asObservable();
    }

    getServiceDisconnected() {
        return this.chatHubDisconnectSubject.asObservable();
    }

    getChatMessage(): Observable<ChatHubMessage> {
        this.connection.on('ReceiveMessage', (conferenceId: string, from: string, message: string, timestamp: Date) => {
            const chat = new ChatHubMessage(conferenceId, from, message, timestamp);
            this.logger.event('ReceiveMessage received', chat);
            this.messageSubject.next(chat);
        });

        return this.messageSubject.asObservable();
    }

    async sendMessage(conferenceId: string, message: string) {
        const from = this.adalService.userInfo.userName.toLocaleLowerCase().trim();
        await this.connection.send('SendMessage', conferenceId, from, message);
    }
}
