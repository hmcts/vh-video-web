import { fakeAsync, tick } from '@angular/core/testing';
import * as signalR from '@microsoft/signalr';
import { Observable, of, ReplaySubject, Subject } from 'rxjs';
import { SecurityServiceProviderService } from '../security/authentication/security-service-provider.service';
import { ISecurityService } from '../security/authentication/security-service.interface';
import { getSpiedPropertyGetter } from '../shared/jasmine-helpers/property-helpers';
import { ConfigService } from './api/config.service';
import { ClientSettingsResponse } from './clients/api-client';
import { ConnectionStatusService } from './connection-status.service';
import { ErrorService } from './error.service';
import { EventsHubService } from './events-hub.service';
import { Logger } from './logging/logger-base';

describe('EventsHubService', () => {
    let serviceUnderTest: EventsHubService;
    let configServiceSpy: jasmine.SpyObj<ConfigService>;
    let connectionStatusServiceSpy: jasmine.SpyObj<ConnectionStatusService>;
    let securityServiceProviderServiceSpy: jasmine.SpyObj<SecurityServiceProviderService>;
    let errorServiceSpy: jasmine.SpyObj<ErrorService>;
    const loggerSpy = jasmine.createSpyObj<Logger>('Logger', ['info', 'warn', 'error', 'debug']);
    let clientSettings$: Subject<ClientSettingsResponse>;
    let connectionStatusChanged$: jasmine.SpyObj<Subject<boolean>>;
    let securityServiceSpy: jasmine.SpyObj<ISecurityService>;

    beforeEach(() => {
        configServiceSpy = jasmine.createSpyObj<ConfigService>('ConfigService', ['getClientSettings']);
        clientSettings$ = new Subject<ClientSettingsResponse>();
        spyOn(clientSettings$, 'subscribe').and.callThrough();
        configServiceSpy.getClientSettings.and.returnValue(clientSettings$);

        securityServiceProviderServiceSpy = jasmine.createSpyObj<SecurityServiceProviderService>(
            'SecurityServiceProviderService',
            [],
            ['currentSecurityService$']
        );

        connectionStatusServiceSpy = jasmine.createSpyObj<ConnectionStatusService>(
            'ConnectionStatusService',
            ['onConnectionStatusChange'],
            ['onUserTriggeredReconnect']
        );
        connectionStatusChanged$ = jasmine.createSpyObj<Subject<boolean>>('Subject', ['subscribe']);
        connectionStatusServiceSpy.onConnectionStatusChange.and.returnValue(connectionStatusChanged$);

        securityServiceSpy = jasmine.createSpyObj<ISecurityService>('SecurityServiceProviderService', [], ['isAuthenticated$']);
        getSpiedPropertyGetter(securityServiceProviderServiceSpy, 'currentSecurityService$').and.returnValue(of(securityServiceSpy));

        errorServiceSpy = jasmine.createSpyObj<ErrorService>('ErrorService', ['goToServiceError']);

        serviceUnderTest = new EventsHubService(
            securityServiceProviderServiceSpy,
            configServiceSpy,
            connectionStatusServiceSpy,
            loggerSpy,
            errorServiceSpy
        );
    });

    describe('construction', () => {
        it('should subscribe to clientSettings of ConfigService and subscribe to connectionStatusChanged of ConnectionStatusService.', () => {
            // Arrange
            const _configServiceSpy = jasmine.createSpyObj<ConfigService>('ConfigService', ['getClientSettings']);
            const _clientSettings$ = jasmine.createSpyObj<Subject<ClientSettingsResponse>>('Subject', ['subscribe']);
            _configServiceSpy.getClientSettings.and.returnValue(_clientSettings$);

            const _connectionStatusServiceSpy = jasmine.createSpyObj<ConnectionStatusService>('ConnectionStatusService', [
                'onConnectionStatusChange'
            ]);
            const _connectionStatusChanged$ = jasmine.createSpyObj<Subject<boolean>>('Subject', ['subscribe']);
            _connectionStatusServiceSpy.onConnectionStatusChange.and.returnValue(_connectionStatusChanged$);

            // Act
            const eventsHubService = new EventsHubService(
                securityServiceProviderServiceSpy,
                _configServiceSpy,
                _connectionStatusServiceSpy,
                loggerSpy,
                errorServiceSpy
            );

            //
            expect(eventsHubService).toBeTruthy();
            expect(_configServiceSpy.getClientSettings).toHaveBeenCalledTimes(1);
            expect(_clientSettings$.subscribe).toHaveBeenCalledTimes(1);
        });
    });

    describe('on getClientSettings', () => {
        it('should call build connection and configure connection.', () => {
            // Arrange
            const expectedEventHubPath = 'test-event-hub-path';
            const clientSettingsResponse = new ClientSettingsResponse();
            clientSettingsResponse.event_hub_path = expectedEventHubPath;

            connectionStatusServiceSpy.onConnectionStatusChange.and.returnValue(connectionStatusChanged$);

            spyOn(serviceUnderTest, 'buildConnection');
            spyOn(serviceUnderTest, 'configureConnection');

            // Act
            clientSettings$.next(clientSettingsResponse);

            // Assert
            expect(serviceUnderTest.buildConnection).toHaveBeenCalledOnceWith(expectedEventHubPath);
            expect(serviceUnderTest.configureConnection).toHaveBeenCalledTimes(1);
            expect(connectionStatusServiceSpy.onConnectionStatusChange).toHaveBeenCalledTimes(1);
            expect(connectionStatusChanged$.subscribe).toHaveBeenCalledTimes(1);
        });
    });

    describe('buildConnection', () => {
        it('should build and return SignalR connection.', () => {
            // Arrange
            const expectedEventHubPath = 'test-event-hub-path';
            const expectedReconnectionTimes = [1, 2, 4, 8];
            const connectionSpy = jasmine.createSpyObj<signalR.HubConnection>('HubConnection', ['start']);

            const hubConnectionBuilderSpy = jasmine.createSpyObj<signalR.HubConnectionBuilder>('HubConnectionBuilder', [
                'configureLogging',
                'withAutomaticReconnect',
                'withUrl',
                'build'
            ]);
            hubConnectionBuilderSpy.configureLogging.and.returnValue(hubConnectionBuilderSpy);
            hubConnectionBuilderSpy.withAutomaticReconnect.and.returnValue(hubConnectionBuilderSpy);
            hubConnectionBuilderSpy.withUrl.and.returnValue(hubConnectionBuilderSpy);
            hubConnectionBuilderSpy.build.and.returnValue(connectionSpy);

            spyOnProperty(serviceUnderTest, 'reconnectionTimes', 'get').and.returnValue(expectedReconnectionTimes);
            spyOn(serviceUnderTest, 'createConnectionBuilder').and.returnValue(hubConnectionBuilderSpy);

            // Act
            const connection = serviceUnderTest.buildConnection(expectedEventHubPath);

            // Assert
            expect(hubConnectionBuilderSpy.withAutomaticReconnect).toHaveBeenCalledOnceWith(expectedReconnectionTimes);
            expect(hubConnectionBuilderSpy.withUrl).toHaveBeenCalledTimes(1);
            expect(hubConnectionBuilderSpy.build).toHaveBeenCalledTimes(1);
            expect(connection).toBe(connectionSpy);
        });
    });

    describe('configureConnection', () => {
        it('should configure the signalR connection and start the hub.', () => {
            // Arrange
            const expectedServerTimeout = 100;
            spyOnProperty(serviceUnderTest, 'serverTimeoutTime', 'get').and.returnValue(expectedServerTimeout);

            const connectionSpy = jasmine.createSpyObj<signalR.HubConnection>('HubConnection', [
                'onclose',
                'onreconnected',
                'onreconnecting'
            ]);
            spyOnProperty(serviceUnderTest, 'connection', 'get').and.returnValue(connectionSpy);

            spyOn(serviceUnderTest, 'start');

            const eventsHubReadySubjectSpy = jasmine.createSpyObj<ReplaySubject<any>>('ReplaySubject', ['next']);
            serviceUnderTest['eventsHubReady'] = eventsHubReadySubjectSpy;

            // Act
            serviceUnderTest.configureConnection();

            // Assert
            expect(connectionSpy.serverTimeoutInMilliseconds).toBe(expectedServerTimeout);
            expect(connectionSpy.onclose).toHaveBeenCalledTimes(1);
            expect(connectionSpy.onreconnected).toHaveBeenCalledTimes(1);
            expect(connectionSpy.onreconnecting).toHaveBeenCalledTimes(1);
            expect(serviceUnderTest.start).toHaveBeenCalledTimes(1);
            expect(eventsHubReadySubjectSpy.next).toHaveBeenCalledTimes(1);
        });
    });

    describe('start', () => {
        it('should try to start the connection if the user is authenticated and the hub is not connected or trying to reconnect', fakeAsync(() => {
            // Arrange
            const connectionSpy = jasmine.createSpyObj<signalR.HubConnection>('HubConnection', ['start']);
            connectionSpy.start.and.resolveTo();

            getSpiedPropertyGetter(securityServiceSpy, 'isAuthenticated$').and.returnValue(
                new Observable<boolean>(observer => {
                    observer.next(true);
                })
            );

            spyOn(serviceUnderTest, 'reconnect');
            spyOnProperty(serviceUnderTest, 'isWaitingToReconnect', 'get').and.returnValue(false);
            spyOnProperty(serviceUnderTest, 'isConnectedToHub', 'get').and.returnValue(false);
            spyOnProperty(serviceUnderTest, 'connection', 'get').and.returnValue(connectionSpy);

            // Act
            serviceUnderTest.start();
            tick();

            // Assert
            expect(serviceUnderTest.reconnectionAttempt).toEqual(0);
            expect(connectionSpy.start).toHaveBeenCalledTimes(1);
            expect(serviceUnderTest.reconnect).not.toHaveBeenCalled();
        }));

        it('should attempt to reconnect if the initial start fails', fakeAsync(() => {
            // Arrange
            const connectionSpy = jasmine.createSpyObj<signalR.HubConnection>('HubConnection', ['start']);
            connectionSpy.start.and.rejectWith('test-error');

            getSpiedPropertyGetter(securityServiceSpy, 'isAuthenticated$').and.returnValue(
                new Observable<boolean>(observer => {
                    observer.next(true);
                })
            );

            spyOn(serviceUnderTest, 'reconnect');
            spyOnProperty(serviceUnderTest, 'isWaitingToReconnect', 'get').and.returnValue(false);
            spyOnProperty(serviceUnderTest, 'isConnectedToHub', 'get').and.returnValue(false);
            spyOnProperty(serviceUnderTest, 'connection', 'get').and.returnValue(connectionSpy);

            // Act
            serviceUnderTest.start();
            tick();

            // Assert
            expect(serviceUnderTest.reconnectionAttempt).toEqual(1);
            expect(connectionSpy.start).toHaveBeenCalledTimes(1);
            expect(serviceUnderTest.reconnect).toHaveBeenCalledTimes(1);
        }));

        it('should NOT try to start the connection if a reconnection is in progress', fakeAsync(() => {
            // Arrange
            const connectionSpy = jasmine.createSpyObj<signalR.HubConnection>('HubConnection', ['start']);

            getSpiedPropertyGetter(securityServiceSpy, 'isAuthenticated$').and.returnValue(
                new Observable<boolean>(observer => {
                    observer.next(true);
                })
            );

            spyOn(serviceUnderTest, 'reconnect');
            spyOnProperty(serviceUnderTest, 'isWaitingToReconnect', 'get').and.returnValue(true);
            spyOnProperty(serviceUnderTest, 'isConnectedToHub', 'get').and.returnValue(false);
            spyOnProperty(serviceUnderTest, 'connection', 'get').and.returnValue(connectionSpy);

            // Act
            serviceUnderTest.start();
            tick();

            // Assert
            expect(connectionSpy.start).not.toHaveBeenCalled();
            expect(serviceUnderTest.reconnect).not.toHaveBeenCalled();
        }));

        it('should NOT try to start the connection if the connection hub is connected', fakeAsync(() => {
            // Arrange
            const connectionSpy = jasmine.createSpyObj<signalR.HubConnection>('HubConnection', ['start']);

            getSpiedPropertyGetter(securityServiceSpy, 'isAuthenticated$').and.returnValue(
                new Observable<boolean>(observer => {
                    observer.next(true);
                })
            );

            spyOn(serviceUnderTest, 'reconnect');
            spyOnProperty(serviceUnderTest, 'isWaitingToReconnect', 'get').and.returnValue(false);
            spyOnProperty(serviceUnderTest, 'isConnectedToHub', 'get').and.returnValue(true);
            spyOnProperty(serviceUnderTest, 'connection', 'get').and.returnValue(connectionSpy);

            // Act
            serviceUnderTest.start();
            tick();

            // Assert
            expect(connectionSpy.start).not.toHaveBeenCalled();
            expect(serviceUnderTest.reconnect).not.toHaveBeenCalled();
        }));
    });

    describe('reconnect', () => {
        it('should attempt to restart the connection if it has NOT exceeded the number of reconnectionTimes', fakeAsync(() => {
            // Arrange
            const reconnectionTimes = [0, 2000, 5000, 10000, 15000, 20000, 30000];

            spyOn(serviceUnderTest, 'start');
            spyOn(serviceUnderTest, 'delay').and.callThrough();
            spyOnProperty(serviceUnderTest, 'reconnectionAttempt', 'get').and.returnValue(1);
            spyOnProperty(serviceUnderTest, 'reconnectionTimes', 'get').and.returnValue(reconnectionTimes);

            // Act
            serviceUnderTest.reconnect();
            tick();

            // Assert
            expect(serviceUnderTest.delay).toHaveBeenCalledOnceWith(reconnectionTimes[0]);
            expect(serviceUnderTest.start).toHaveBeenCalledTimes(1);
            expect(errorServiceSpy.goToServiceError).not.toHaveBeenCalled();
        }));

        it('should go to the service error page if it has exceded the number of reconnectionTimes and subscribe to the onUserTriggeredReconnect', fakeAsync(() => {
            // Arrange
            const reconnectionTimes = [0, 2000, 5000, 10000, 15000, 20000, 30000];

            spyOn(serviceUnderTest, 'start');
            spyOn(serviceUnderTest, 'delay').and.callThrough();
            spyOnProperty(serviceUnderTest, 'reconnectionTimes', 'get').and.returnValue(reconnectionTimes);
            spyOnProperty(serviceUnderTest, 'reconnectionAttempt', 'get').and.returnValue(reconnectionTimes.length + 1);

            const onUserTriggeredReconnect$Spy = jasmine.createSpyObj<Observable<boolean>>('Observable', ['pipe', 'subscribe']);
            onUserTriggeredReconnect$Spy.pipe.and.returnValue(onUserTriggeredReconnect$Spy);

            getSpiedPropertyGetter(connectionStatusServiceSpy, 'onUserTriggeredReconnect').and.returnValue(onUserTriggeredReconnect$Spy);

            // Act
            serviceUnderTest.reconnect();
            tick();

            // Assert
            expect(serviceUnderTest.start).not.toHaveBeenCalled();
            expect(serviceUnderTest.delay).not.toHaveBeenCalled();
            expect(errorServiceSpy.goToServiceError).toHaveBeenCalledTimes(1);
            expect(onUserTriggeredReconnect$Spy.subscribe).toHaveBeenCalledTimes(1);
        }));

        it('should call handleUserTriggeredReconnect when the reconnection was successful', () => {
            // Arrange
            const reconnectionTimes = [0, 2000, 5000, 10000, 15000, 20000, 30000];

            spyOn(serviceUnderTest, 'handleUserTriggeredReconnect');
            spyOnProperty(serviceUnderTest, 'reconnectionTimes', 'get').and.returnValue(reconnectionTimes);
            spyOnProperty(serviceUnderTest, 'reconnectionAttempt', 'get').and.returnValue(reconnectionTimes.length + 1);

            const onUserTriggeredReconnectSubject = new Subject<boolean>();
            getSpiedPropertyGetter(connectionStatusServiceSpy, 'onUserTriggeredReconnect').and.returnValue(
                onUserTriggeredReconnectSubject.asObservable()
            );

            serviceUnderTest.reconnect();

            // Act
            onUserTriggeredReconnectSubject.next(true);

            // Assert
            expect(serviceUnderTest.handleUserTriggeredReconnect).toHaveBeenCalledTimes(1);
        });

        it('should NOT call handleUserTriggeredReconnect when the reconnection was NOT successful', () => {
            // Arrange
            const reconnectionTimes = [0, 2000, 5000, 10000, 15000, 20000, 30000];

            spyOn(serviceUnderTest, 'handleUserTriggeredReconnect');
            spyOnProperty(serviceUnderTest, 'reconnectionTimes', 'get').and.returnValue(reconnectionTimes);
            spyOnProperty(serviceUnderTest, 'reconnectionAttempt', 'get').and.returnValue(reconnectionTimes.length + 1);

            const onUserTriggeredReconnectSubject = new Subject<boolean>();
            getSpiedPropertyGetter(connectionStatusServiceSpy, 'onUserTriggeredReconnect').and.returnValue(
                onUserTriggeredReconnectSubject.asObservable()
            );

            serviceUnderTest.reconnect();

            // Act
            onUserTriggeredReconnectSubject.next(false);

            // Assert
            expect(serviceUnderTest.handleUserTriggeredReconnect).not.toHaveBeenCalled();
        });

        it('should only handle the first userTriggeredReconnect even where reconnection was successful', () => {
            // Arrange
            const reconnectionTimes = [0, 2000, 5000, 10000, 15000, 20000, 30000];

            spyOn(serviceUnderTest, 'handleUserTriggeredReconnect');
            spyOnProperty(serviceUnderTest, 'reconnectionTimes', 'get').and.returnValue(reconnectionTimes);
            spyOnProperty(serviceUnderTest, 'reconnectionAttempt', 'get').and.returnValue(reconnectionTimes.length + 1);

            const onUserTriggeredReconnectSubject = new Subject<boolean>();
            getSpiedPropertyGetter(connectionStatusServiceSpy, 'onUserTriggeredReconnect').and.returnValue(
                onUserTriggeredReconnectSubject.asObservable()
            );

            serviceUnderTest.reconnect();

            // Act
            onUserTriggeredReconnectSubject.next(false);
            onUserTriggeredReconnectSubject.next(false);
            onUserTriggeredReconnectSubject.next(true);
            onUserTriggeredReconnectSubject.next(true);
            onUserTriggeredReconnectSubject.next(true);
            onUserTriggeredReconnectSubject.next(true);
            onUserTriggeredReconnectSubject.next(true);

            // Assert
            expect(serviceUnderTest.handleUserTriggeredReconnect).toHaveBeenCalledTimes(1);
        });
    });

    describe('stop', () => {
        it('should call connection stop if it is NOT already disconnected', fakeAsync(() => {
            // Arrange
            const connectionSpy = jasmine.createSpyObj<signalR.HubConnection>('HubConnection', ['stop']);
            connectionSpy.stop.and.rejectWith();

            spyOnProperty(serviceUnderTest, 'connection', 'get').and.returnValue(connectionSpy);
            spyOnProperty(serviceUnderTest, 'isDisconnectedFromHub').and.returnValue(false);

            // Act
            serviceUnderTest.stop();
            tick();

            // Assert
            expect(connectionSpy.stop).toHaveBeenCalledTimes(1);
        }));

        it('should NOT call connection stop if it is already disconnected', fakeAsync(() => {
            // Arrange
            const connectionSpy = jasmine.createSpyObj<signalR.HubConnection>('HubConnection', ['stop']);
            connectionSpy.stop.and.resolveTo();

            spyOnProperty(serviceUnderTest, 'connection', 'get').and.returnValue(connectionSpy);
            spyOnProperty(serviceUnderTest, 'isDisconnectedFromHub').and.returnValue(true);

            // Act
            serviceUnderTest.stop();
            tick();

            // Assert
            expect(connectionSpy.stop).not.toHaveBeenCalled();
        }));
    });

    describe('onConnectionStatusChange', () => {
        it('should try to start the event hub connection when isConnected is true.', () => {
            // Arrange
            spyOn(serviceUnderTest, 'start');
            spyOn(serviceUnderTest, 'stop');

            // Act
            serviceUnderTest.handleConnectionStatusChanged(true);

            // Assert
            expect(serviceUnderTest.start).toHaveBeenCalledTimes(1);
            expect(serviceUnderTest.stop).not.toHaveBeenCalled();
        });

        it('should try to do nothing when isConnected is false and let the signal r reconnection run its course.', () => {
            // Arrange
            spyOn(serviceUnderTest, 'start');
            spyOn(serviceUnderTest, 'stop');

            // Act
            serviceUnderTest.handleConnectionStatusChanged(false);

            // Assert
            expect(serviceUnderTest.start).not.toHaveBeenCalled();
            expect(serviceUnderTest.stop).not.toHaveBeenCalled();
        });
    });

    describe('isConnectedToHub', () => {
        it('should return true when the hub state is connected', () => {
            // Arrange
            const connectionSpy = jasmine.createSpyObj<signalR.HubConnection>('HubConnection', ['start'], ['state']);
            getSpiedPropertyGetter(connectionSpy, 'state').and.returnValue(signalR.HubConnectionState.Connected);

            spyOnProperty(serviceUnderTest, 'connection', 'get').and.returnValue(connectionSpy);

            // Act
            const isConnected = serviceUnderTest.isConnectedToHub;

            // Assert
            expect(isConnected).toBeTrue();
        });

        it('should return true when the hub state is connecting', () => {
            // Arrange
            const connectionSpy = jasmine.createSpyObj<signalR.HubConnection>('HubConnection', ['start'], ['state']);
            getSpiedPropertyGetter(connectionSpy, 'state').and.returnValue(signalR.HubConnectionState.Connecting);

            spyOnProperty(serviceUnderTest, 'connection', 'get').and.returnValue(connectionSpy);

            // Act
            const isConnected = serviceUnderTest.isConnectedToHub;

            // Assert
            expect(isConnected).toBeTrue();
        });

        it('should return true when the hub state is reconnecting', () => {
            // Arrange
            const connectionSpy = jasmine.createSpyObj<signalR.HubConnection>('HubConnection', ['start'], ['state']);
            getSpiedPropertyGetter(connectionSpy, 'state').and.returnValue(signalR.HubConnectionState.Reconnecting);

            spyOnProperty(serviceUnderTest, 'connection', 'get').and.returnValue(connectionSpy);

            // Act
            const isConnected = serviceUnderTest.isConnectedToHub;

            // Assert
            expect(isConnected).toBeTrue();
        });

        it('should return false when the hub state is disonnecting', () => {
            // Arrange
            const connectionSpy = jasmine.createSpyObj<signalR.HubConnection>('HubConnection', ['start'], ['state']);
            getSpiedPropertyGetter(connectionSpy, 'state').and.returnValue(signalR.HubConnectionState.Disconnecting);

            spyOnProperty(serviceUnderTest, 'connection', 'get').and.returnValue(connectionSpy);

            // Act
            const isConnected = serviceUnderTest.isConnectedToHub;

            // Assert
            expect(isConnected).toBeFalse();
        });

        it('should return false when the hub state is disconnected', () => {
            // Arrange
            const connectionSpy = jasmine.createSpyObj<signalR.HubConnection>('HubConnection', ['start'], ['state']);
            getSpiedPropertyGetter(connectionSpy, 'state').and.returnValue(signalR.HubConnectionState.Disconnected);

            spyOnProperty(serviceUnderTest, 'connection', 'get').and.returnValue(connectionSpy);

            // Act
            const isConnected = serviceUnderTest.isConnectedToHub;

            // Assert
            expect(isConnected).toBeFalse();
        });
    });

    describe('isDisconnectedFromHub', () => {
        it('should return false when the hub state is connected', () => {
            // Arrange
            const connectionSpy = jasmine.createSpyObj<signalR.HubConnection>('HubConnection', ['start'], ['state']);
            getSpiedPropertyGetter(connectionSpy, 'state').and.returnValue(signalR.HubConnectionState.Connected);

            spyOnProperty(serviceUnderTest, 'connection', 'get').and.returnValue(connectionSpy);

            // Act
            const isDisconnected = serviceUnderTest.isDisconnectedFromHub;

            // Assert
            expect(isDisconnected).toBeFalse();
        });

        it('should return false when the hub state is connecting', () => {
            // Arrange
            const connectionSpy = jasmine.createSpyObj<signalR.HubConnection>('HubConnection', ['start'], ['state']);
            getSpiedPropertyGetter(connectionSpy, 'state').and.returnValue(signalR.HubConnectionState.Connecting);

            spyOnProperty(serviceUnderTest, 'connection', 'get').and.returnValue(connectionSpy);

            // Act
            const isDisconnected = serviceUnderTest.isDisconnectedFromHub;

            // Assert
            expect(isDisconnected).toBeFalse();
        });

        it('should return false when the hub state is reconnecting', () => {
            // Arrange
            const connectionSpy = jasmine.createSpyObj<signalR.HubConnection>('HubConnection', ['start'], ['state']);
            getSpiedPropertyGetter(connectionSpy, 'state').and.returnValue(signalR.HubConnectionState.Reconnecting);

            spyOnProperty(serviceUnderTest, 'connection', 'get').and.returnValue(connectionSpy);

            // Act
            const isDisconnected = serviceUnderTest.isDisconnectedFromHub;

            // Assert
            expect(isDisconnected).toBeFalse();
        });

        it('should return true when the hub state is disonnecting', () => {
            // Arrange
            const connectionSpy = jasmine.createSpyObj<signalR.HubConnection>('HubConnection', ['start'], ['state']);
            getSpiedPropertyGetter(connectionSpy, 'state').and.returnValue(signalR.HubConnectionState.Disconnecting);

            spyOnProperty(serviceUnderTest, 'connection', 'get').and.returnValue(connectionSpy);

            // Act
            const isDisconnected = serviceUnderTest.isDisconnectedFromHub;

            // Assert
            expect(isDisconnected).toBeTrue();
        });

        it('should return true when the hub state is disconnected', () => {
            // Arrange
            const connectionSpy = jasmine.createSpyObj<signalR.HubConnection>('HubConnection', ['start'], ['state']);
            getSpiedPropertyGetter(connectionSpy, 'state').and.returnValue(signalR.HubConnectionState.Disconnected);

            spyOnProperty(serviceUnderTest, 'connection', 'get').and.returnValue(connectionSpy);

            // Act
            const isDisconnected = serviceUnderTest.isDisconnectedFromHub;

            // Assert
            expect(isDisconnected).toBeTrue();
        });
    });

    describe('getters', () => {
        it('onEventsHubReady', () => {
            // Arrange
            const expectedObservable = jasmine.createSpyObj<Observable<any>>('Observable', ['subscribe']);

            const subjectSpy = jasmine.createSpyObj<ReplaySubject<void>>('ReplaySubject', ['asObservable']);
            subjectSpy.asObservable.and.returnValue(expectedObservable);
            serviceUnderTest['eventsHubReady'] = subjectSpy;

            // Act
            const observable = serviceUnderTest.onEventsHubReady;

            // Assert
            expect(subjectSpy.asObservable).toHaveBeenCalledTimes(1);
            expect(observable).toBe(expectedObservable);
        });

        it('connection', () => {
            // Arrange
            const expectedConnection = jasmine.createSpyObj<signalR.HubConnection>('HubConnection', ['start']);
            serviceUnderTest['_connection'] = expectedConnection;

            // Act
            const connection = serviceUnderTest.connection;

            // Assert
            expect(connection).toEqual(expectedConnection);
        });

        it('reconnectionTimes', () => {
            // Arrange
            const expectedReconnectionTimes = [0, 1, 2, 4];
            serviceUnderTest['_reconnectionTimes'] = expectedReconnectionTimes;

            // Act
            const reconnectionTimes = serviceUnderTest.reconnectionTimes;

            // Assert
            expect(reconnectionTimes).toEqual(expectedReconnectionTimes);
        });

        it('serverTimeoutTime', () => {
            // Arrange
            const expectedTimeOutTime = 12;
            serviceUnderTest['_serverTimeoutTime'] = expectedTimeOutTime;

            // Act
            const timeOutTime = serviceUnderTest.serverTimeoutTime;

            // Assert
            expect(timeOutTime).toEqual(expectedTimeOutTime);
        });

        it('reconnectionAttempt', () => {
            // Arrange
            const expectedReconnectionAttempt = 23;
            serviceUnderTest['_reconnectionAttempt'] = expectedReconnectionAttempt;

            // Act
            const reconnectionAttempt = serviceUnderTest.reconnectionAttempt;

            // Assert
            expect(reconnectionAttempt).toEqual(expectedReconnectionAttempt);
        });

        it('isWaitingToReconnect - truthy', () => {
            // Arrange
            serviceUnderTest['reconnectionPromise'] = new Promise<void>(resolve => resolve());

            // Act
            const isWaitingToReconnect = serviceUnderTest.isWaitingToReconnect;

            // Assert
            expect(isWaitingToReconnect).toBeTrue();
        });

        it('isWaitingToReconnect - falsey', () => {
            // Arrange
            serviceUnderTest['_reconnectionPromise'] = null;

            // Act
            const isWaitingToReconnect = serviceUnderTest.isWaitingToReconnect;

            // Assert
            expect(isWaitingToReconnect).toBeFalse();
        });
    });
});
