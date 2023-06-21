import { Injectable, OnDestroy } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { ReplaySubject, Subject, Observable, combineLatest } from 'rxjs';
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
export class EventsHubService implements OnDestroy {
    private currentIdp: string;
    private securityService: ISecurityService;
    private eventHubDisconnectSubject = new Subject<number>();
    private eventHubConnectedSubject = new Subject();
    private destroyed$ = new Subject();

    private eventsHubReady = new ReplaySubject<void>(1);
    private _connection: signalR.HubConnection;
    private _reconnectionTimes = [0, 2000, 5000, 10000, 15000, 20000, 30000];
    private _serverTimeoutTime = 60000;
    private _reconnectionAttempt = 0;
    private reconnectionPromise: Promise<any>;

    constructor(
        securityServiceProviderService: SecurityServiceProvider,
        configService: ConfigService,
        private connectionStatusService: ConnectionStatusService,
        private logger: Logger,
        private errorService: ErrorService
    ) {
        combineLatest([securityServiceProviderService.currentSecurityService$, securityServiceProviderService.currentIdp$])
            .pipe(takeUntil(this.destroyed$))
            .subscribe(([service, idp]) => {
                this.securityService = service;
                this.currentIdp = idp;
            });
        configService.getClientSettings().subscribe(clientSettings => {
            this._connection = this.buildConnection(clientSettings.event_hub_path);
            this.configureConnection();
            connectionStatusService.onConnectionStatusChange().subscribe(isConnected => this.handleConnectionStatusChanged(isConnected));
        });
    }

    get onEventsHubReady(): Observable<void> {
        return this.eventsHubReady.asObservable();
    }

    get connection(): signalR.HubConnection {
        return this._connection;
    }

    get reconnectionTimes() {
        return this._reconnectionTimes;
    }

    get serverTimeoutTime() {
        return this._serverTimeoutTime;
    }

    get reconnectionAttempt() {
        return this._reconnectionAttempt;
    }

    get isWaitingToReconnect(): boolean {
        return !!this.reconnectionPromise;
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

    ngOnDestroy(): void {
        this.destroyed$.next();
    }

    createConnectionBuilder(): signalR.HubConnectionBuilder {
        return new signalR.HubConnectionBuilder();
    }

    buildConnection(eventHubPath: string): signalR.HubConnection {
        return this.createConnectionBuilder()
            .configureLogging(signalR.LogLevel.Debug)
            .withAutomaticReconnect(this.reconnectionTimes)
            .withUrl(eventHubPath, {
                accessTokenFactory: () => this.securityService.getAccessToken(this.currentIdp).toPromise()
            })
            .build();
    }

    configureConnection() {
        this.connection.serverTimeoutInMilliseconds = this.serverTimeoutTime;
        this.connection.onreconnecting(error => this.onEventHubReconnecting(error));
        this.connection.onreconnected(() => this.onEventHubConnected());
        this.connection.onclose(error => this.onEventHubErrorOrClose(error));

        this.eventsHubReady.next();
        this.start();
    }

    start() {
        if (this.isWaitingToReconnect) {
            this.logger.info('[EventsService] - A reconnection promise already exists');
            return;
        }

        if (!this.isConnectedToHub) {
            this._reconnectionAttempt++;
            this.connection
                .start()
                .then(() => {
                    this.logger.info('[EventsService] - Successfully connected to EventHub');
                    this._reconnectionAttempt = 0;
                    this.onEventHubConnected();
                })
                .catch(async error => {
                    this.logger.warn(`[EventsService] - Failed to connect to EventHub ${error}`);
                    this.onEventHubErrorOrClose(error); // TEST I THINK THIS IS REDUNDANT
                    this.reconnect();
                });
        } else {
            this.logger.debug('[EventsService] - Cannot start - already connected to the event hub');
        }
    }

    reconnect() {
        if (this.reconnectionTimes.length >= this.reconnectionAttempt) {
            const delayMs = this.reconnectionTimes[this.reconnectionAttempt - 1];
            this.logger.info(`[EventsService] - Reconnecting in ${delayMs}ms`);

            this.reconnectionPromise = this.delay(delayMs).then(() => {
                this.reconnectionPromise = null;
                this.start();
            });
        } else {
            this.logger.info(`[EventsService] - Failed to connect too many times (#${this.reconnectionAttempt}), going to service error`);
            this.errorService.goToServiceError('Your connection was lost');

            // Only subscibe to the first emitted event where the reconnection was successful
            this.connectionStatusService.onUserTriggeredReconnect
                .pipe(filter(Boolean), take(1))
                .subscribe(() => this.handleUserTriggeredReconnect());
        }
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

    async delay(ms: number) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    handleUserTriggeredReconnect() {
        this._reconnectionAttempt = 1;
        this.reconnect();
    }

    getServiceDisconnected(): Observable<number> {
        return this.eventHubDisconnectSubject.asObservable();
    }

    getServiceConnected(): Observable<any> {
        return this.eventHubConnectedSubject.asObservable();
    }

    handleConnectionStatusChanged(isConnected: boolean) {
        if (isConnected) {
            this.logger.info('[EventsService] - Connection status changed: connected.');
            this.start();
        }
    }

    private onEventHubErrorOrClose(error: Error): void {
        const message = error ? 'EventHub connection error' : 'EventHub connection closed';
        this.logger.error(`[EventsService] - ${message}`, error);
        this.eventHubDisconnectSubject.next(this.reconnectionAttempt);
    }

    private onEventHubConnected(): void {
        this.logger.info('[EventsService] - Successfully reconnected to EventHub');
        this._reconnectionAttempt = 0;
        this.eventHubConnectedSubject.next();
    }

    private onEventHubReconnecting(error: Error): void {
        this._reconnectionAttempt++;
        this.logger.info('[EventsService] - Attempting to reconnect to EventHub: attempt #' + this.reconnectionAttempt);
        if (error) {
            this.logger.error('[EventsService] - Error during reconnect to EventHub', error);
            this.eventHubDisconnectSubject.next(this.reconnectionAttempt);
        }
    }
}
