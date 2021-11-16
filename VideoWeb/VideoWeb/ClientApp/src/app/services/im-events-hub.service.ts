import { Injectable, OnDestroy } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { ReplaySubject, Subject, Observable } from 'rxjs';
import { filter, take, takeUntil } from 'rxjs/operators';
import { SecurityServiceProvider } from '../security/authentication/security-provider.service';
import { ISecurityService } from '../security/authentication/security-service.interface';
import { ConfigService } from './api/config.service';
import { ConnectionStatusService } from './connection-status.service';
import { ErrorService } from './error.service';
import { Logger } from './logging/logger-base';

@Injectable({
    providedIn: 'root'
})
export class ImEventsHubService implements OnDestroy {
    private securityService: ISecurityService;
    private imEventHubDisconnectSubject = new Subject<number>();
    private imEventHubConnectedSubject = new Subject();
    private destroyed$ = new Subject();

    private imEventsHubReady = new ReplaySubject<void>(1);
    get onImEventsHubReady(): Observable<void> {
        return this.imEventsHubReady.asObservable();
    }

    private _connection: signalR.HubConnection;
    get connection(): signalR.HubConnection {
        return this._connection;
    }

    private _reconnectionTimes = [0, 2000, 5000, 10000, 15000, 20000, 30000];
    get reconnectionTimes() {
        return this._reconnectionTimes;
    }

    private _serverTimeoutTime = 300000;
    get serverTimeoutTime() {
        return this._serverTimeoutTime;
    }

    private _reconnectionAttempt = 0;
    get reconnectionAttempt() {
        return this._reconnectionAttempt;
    }

    private reconnectionPromise: Promise<any>;
    get isWaitingToReconnect(): boolean {
        return !!this.reconnectionPromise;
    }

    get isConnectedToImHub(): boolean {
        return (
            this.connection.state === signalR.HubConnectionState.Connected ||
            this.connection.state === signalR.HubConnectionState.Connecting ||
            this.connection.state === signalR.HubConnectionState.Reconnecting
        );
    }

    get isDisconnectedFromImHub(): boolean {
        return (
            this.connection.state === signalR.HubConnectionState.Disconnected ||
            this.connection.state === signalR.HubConnectionState.Disconnecting
        );
    }

    constructor(
        securityServiceProviderService: SecurityServiceProvider,
        configService: ConfigService,
        private connectionStatusService: ConnectionStatusService,
        private logger: Logger,
        private errorService: ErrorService
    ) {
        securityServiceProviderService.currentSecurityService$
            .pipe(takeUntil(this.destroyed$))
            .subscribe(securityService => (this.securityService = securityService));
        configService.getClientSettings().subscribe(clientSettings => {
            this._connection = this.buildConnection(clientSettings.im_event_hub_path);
            this.configureConnection();
            connectionStatusService.onConnectionStatusChange().subscribe(isConnected => this.handleConnectionStatusChanged(isConnected));
        });
    }
    ngOnDestroy(): void {
        this.destroyed$.next();
    }

    createConnectionBuilder(): signalR.HubConnectionBuilder {
        return new signalR.HubConnectionBuilder();
    }

    buildConnection(imEventHubPath: string): signalR.HubConnection {
        return this.createConnectionBuilder()
            .configureLogging(signalR.LogLevel.Debug)
            .withAutomaticReconnect(this.reconnectionTimes)
            .withUrl(imEventHubPath, {
                accessTokenFactory: () => this.securityService.getToken()
            })
            .build();
    }

    configureConnection() {
        this.connection.serverTimeoutInMilliseconds = this.serverTimeoutTime;
        this.connection.onreconnecting(error => this.onImEventHubReconnecting(error));
        this.connection.onreconnected(() => this.onEventHubConnected());
        this.connection.onclose(error => this.onEventHubErrorOrClose(error));

        this.imEventsHubReady.next();
        this.start();
    }

    start() {
        if (this.isWaitingToReconnect) {
            this.logger.info('[ImEventsService] - A reconnection promise already exists');
            return;
        }

        if (!this.isConnectedToImHub) {
            this._reconnectionAttempt++;
            this.connection
                .start()
                .then(() => {
                    this.logger.info('[ImEventsService] - Successfully connected to EventHub');
                    this._reconnectionAttempt = 0;
                    this.onEventHubConnected();
                })
                .catch(async error => {
                    this.logger.warn(`[ImEventsService] - Failed to connect to EventHub ${error}`);
                    this.onEventHubErrorOrClose(error); // TEST I THINK THIS IS REDUNDANT
                    this.reconnect();
                });
        } else {
            this.logger.debug(`[ImEventsService] - Cannot start - already connected to the event hub`);
        }
    }

    reconnect() {
        if (this.reconnectionTimes.length >= this.reconnectionAttempt) {
            const delayMs = this.reconnectionTimes[this.reconnectionAttempt - 1];
            this.logger.info(`[ImEventsService] - Reconnecting in ${delayMs}ms`);

            this.reconnectionPromise = this.delay(delayMs).then(() => {
                this.reconnectionPromise = null;
                this.start();
            });
        } else {
            this.logger.info(`[ImEventsService] - Failed to connect too many times (#${this.reconnectionAttempt}), going to service error`);
            this.errorService.goToServiceError('Your connection was lost');

            // Only subscibe to the first emitted event where the reconnection was successful
            this.connectionStatusService.onUserTriggeredReconnect
                .pipe(filter(Boolean), take(1))
                .subscribe(() => this.handleUserTriggeredReconnect());
        }
    }

    stop() {
        if (!this.isDisconnectedFromImHub) {
            this.logger.debug(`[ImEventsService] - Ending connection to EventHub. Current state: ${this.connection.state}`);
            this.connection
                .stop()
                .then(() => {
                    this.logger.debug(`[ImEventsService] - Connection stopped, new state: ${this.connection.state}`);
                })
                .catch(err => this.logger.error('[ImEventsService] - Failed to stop connection to EventHub', err));
        }
    }

    async delay(ms: number) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    handleUserTriggeredReconnect() {
        this._reconnectionAttempt = 1;
        this.reconnect();
    }

    private onEventHubErrorOrClose(error: Error): void {
        const message = error ? 'ImEventHub connection error' : 'ImEventHub connection closed';
        this.logger.error(`[ImEventsService] - ${message}`, error);
        this.imEventHubDisconnectSubject.next(this.reconnectionAttempt);
    }

    getServiceDisconnected(): Observable<number> {
        return this.imEventHubDisconnectSubject.asObservable();
    }

    private onEventHubConnected(): void {
        this.logger.info('[ImEventsService] - Successfully reconnected to EventHub');
        this._reconnectionAttempt = 0;
        this.imEventHubConnectedSubject.next();
    }

    getServiceConnected(): Observable<any> {
        return this.imEventHubConnectedSubject.asObservable();
    }

    private onImEventHubReconnecting(error: Error): void {
        this._reconnectionAttempt++;
        this.logger.info('[ImEventsService] - Attempting to reconnect to EventHub: attempt #' + this.reconnectionAttempt);
        if (error) {
            this.logger.error('[ImEventsService] - Error during reconnect to EventHub', error);
            this.imEventHubDisconnectSubject.next(this.reconnectionAttempt);
        }
    }

    handleConnectionStatusChanged(isConnected: boolean) {
        if (isConnected) {
            this.logger.info('[ImEventsService] - Connection status changed: connected.');
            this.start();
        }
    }
}
