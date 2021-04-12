import { fakeAsync, tick } from '@angular/core/testing';
import { HubConnection } from '@microsoft/signalr';
import { OidcSecurityService } from 'angular-auth-oidc-client';
import { Observable, of, Subject } from 'rxjs';
import { ConfigService } from './api/config.service';
import { ClientSettingsResponse } from './clients/api-client';
import { ConnectionStatusService } from './connection-status.service';
import { ErrorService } from './error.service';
import { EventsHubService } from './events-hub.service';
import { Logger } from './logging/logger-base';

fdescribe('EventsHubService', () => {
    function spyPropertyGetter<T, K extends keyof T>(
        spyObj: jasmine.SpyObj<T>,
        propName: K
      ): jasmine.Spy<() => T[K]> {
        return Object.getOwnPropertyDescriptor(spyObj, propName)?.get as jasmine.Spy<() => T[K]>;
      }

      function spyPropertySetter<T, K extends keyof T>(
        spyObj: jasmine.SpyObj<T>,
        propName: K
      ): jasmine.Spy<() => T[K]> {
        return Object.getOwnPropertyDescriptor(spyObj, propName)?.set as jasmine.Spy<() => T[K]>;
      }

    let serviceUnderTest : EventsHubService;
    let configServiceSpy : jasmine.SpyObj<ConfigService>;
    let connectionStatusServiceSpy : jasmine.SpyObj<ConnectionStatusService>;
    let oidcSecurityServiceSpy : jasmine.SpyObj<OidcSecurityService>;
    let errorServiceSpy : jasmine.SpyObj<ErrorService>;
    let loggerSpy = jasmine.createSpyObj<Logger>("Logger", ["info", "warn", "error", "debug"]);
    let clientSettings$ : Subject<ClientSettingsResponse>;
    let connectionStatusChanged$ : jasmine.SpyObj<Subject<boolean>>;

    beforeEach(() => {
        configServiceSpy = jasmine.createSpyObj<ConfigService>("ConfigService", ["getClientSettings"]);
        clientSettings$ = new Subject<ClientSettingsResponse>();
        spyOn(clientSettings$, "subscribe").and.callThrough();
        configServiceSpy.getClientSettings.and.returnValue(clientSettings$);

        connectionStatusServiceSpy = jasmine.createSpyObj<ConnectionStatusService>("ConnectionStatusService", ["onConnectionStatusChange"]);
        connectionStatusChanged$ = jasmine.createSpyObj<Subject<boolean>>("Subject", ["subscribe"]);
        connectionStatusServiceSpy.onConnectionStatusChange.and.returnValue(connectionStatusChanged$);

        oidcSecurityServiceSpy = jasmine.createSpyObj<OidcSecurityService>("OidcSecurityService", ["getToken"], ["isAuthenticated$"]);

        errorServiceSpy = jasmine.createSpyObj<ErrorService>("ErrorService", ["goToServiceError"]);

        serviceUnderTest = new EventsHubService(configServiceSpy, connectionStatusServiceSpy, oidcSecurityServiceSpy, loggerSpy, errorServiceSpy);
    });

    describe('construction', () => {
        it("should subscribe to clientSettings of ConfigService and subscribe to connectionStatusChanged of ConnectionStatusService.", () => {
            // Arrange
            const _configServiceSpy = jasmine.createSpyObj<ConfigService>("ConfigService", ["getClientSettings"]);
            const _clientSettings$ = jasmine.createSpyObj<Subject<ClientSettingsResponse>>("Subject", ["subscribe"]);
            _configServiceSpy.getClientSettings.and.returnValue(_clientSettings$);

            const _connectionStatusServiceSpy = jasmine.createSpyObj<ConnectionStatusService>("ConnectionStatusService", ["onConnectionStatusChange"]);
            const _connectionStatusChanged$ = jasmine.createSpyObj<Subject<boolean>>("Subject", ["subscribe"]);
            _connectionStatusServiceSpy.onConnectionStatusChange.and.returnValue(_connectionStatusChanged$);

            // Act
            new EventsHubService(_configServiceSpy, _connectionStatusServiceSpy, oidcSecurityServiceSpy, loggerSpy, errorServiceSpy);

            // Assert
            expect(_configServiceSpy.getClientSettings).toHaveBeenCalledTimes(1);
            expect(_clientSettings$.subscribe).toHaveBeenCalledTimes(1);
            expect(_connectionStatusServiceSpy.onConnectionStatusChange).toHaveBeenCalledTimes(1);
            expect(_connectionStatusChanged$.subscribe).toHaveBeenCalledTimes(1);
        });
    });

    describe('on getClientSettings', () => {
        it('should call build connection and configure connection.', () => {
            // Arrange
            const expectedEventHubPath = "test-event-hub-path";
            const clientSettingsResponse = new ClientSettingsResponse();
            clientSettingsResponse.event_hub_path = expectedEventHubPath;

            spyOn(serviceUnderTest, "buildConnection");
            spyOn(serviceUnderTest, "configureConnection");

            // Act
            clientSettings$.next(clientSettingsResponse);

            // Assert
            expect(serviceUnderTest.buildConnection).toHaveBeenCalledOnceWith(expectedEventHubPath);
            expect(serviceUnderTest.configureConnection).toHaveBeenCalledTimes(1);
        });
    });

    describe('buildConnection', () => {
        it('should build and return SignalR connection.', () => {
            // Arrange
            const expectedEventHubPath = "test-event-hub-path";
            const expectedReconnectionTimes = [1, 2, 4, 8];
            const connectionSpy = jasmine.createSpyObj<signalR.HubConnection>("HubConnection", ["start"]);

            const hubConnectionBuilderSpy = jasmine.createSpyObj<signalR.HubConnectionBuilder>("HubConnectionBuilder", ["configureLogging", "withAutomaticReconnect", "withUrl", "build"]);
            hubConnectionBuilderSpy.configureLogging.and.returnValue(hubConnectionBuilderSpy);
            hubConnectionBuilderSpy.withAutomaticReconnect.and.returnValue(hubConnectionBuilderSpy);
            hubConnectionBuilderSpy.withUrl.and.returnValue(hubConnectionBuilderSpy);
            hubConnectionBuilderSpy.build.and.returnValue(connectionSpy);

            spyOnProperty(serviceUnderTest, "reconnectionTimes", "get").and.returnValue(expectedReconnectionTimes);
            spyOn(serviceUnderTest, "createConnectionBuilder").and.returnValue(hubConnectionBuilderSpy);

            // Act
            var connection = serviceUnderTest.buildConnection(expectedEventHubPath);

            // Assert
            expect(hubConnectionBuilderSpy.withAutomaticReconnect).toHaveBeenCalledOnceWith(expectedReconnectionTimes);
            expect(hubConnectionBuilderSpy.withUrl).toHaveBeenCalledTimes(1);
            expect(hubConnectionBuilderSpy.build).toHaveBeenCalledTimes(1);
            expect(connection).toBe(connectionSpy);
        });
    });

    describe('configureConnection', () => {
        it('should configure the signalR connection.', () => {
            // Arrange
            const expectedServerTimeout = 100;

            const connectionSpy = jasmine.createSpyObj<signalR.HubConnection>("HubConnection", ["onclose", "onreconnected", "onreconnecting"]);
            spyOnProperty(serviceUnderTest, "connection", "get").and.returnValue(connectionSpy);

            spyOnProperty(serviceUnderTest, "serverTimeoutTime", "get").and.returnValue(expectedServerTimeout);

            // Act
            serviceUnderTest.configureConnection();

            // Assert
            expect(connectionSpy.serverTimeoutInMilliseconds).toBe(expectedServerTimeout);
            expect(connectionSpy.onclose).toHaveBeenCalledTimes(1);
            expect(connectionSpy.onreconnected).toHaveBeenCalledTimes(1);
            expect(connectionSpy.onreconnecting).toHaveBeenCalledTimes(1);
        });
    });

    describe('start', () => {
        it('should try to start the connection if the user is authenticated and the hub is not connected or trying to reconnect', fakeAsync(() => {
            // Arrange
            const connectionSpy = jasmine.createSpyObj<signalR.HubConnection>("HubConnection", ["start"]);
            connectionSpy.start.and.resolveTo();

            spyPropertyGetter(oidcSecurityServiceSpy, 'isAuthenticated$').and.returnValue(new Observable<boolean>((observer) => {
                observer.next(true);
            }));

            spyOn(serviceUnderTest, "reconnect");
            spyOnProperty(serviceUnderTest, "isReconnecting", "get").and.returnValue(false);
            spyOnProperty(serviceUnderTest, "isConnectedToHub", "get").and.returnValue(false);
            spyOnProperty(serviceUnderTest, "connection", "get").and.returnValue(connectionSpy);

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
            const connectionSpy = jasmine.createSpyObj<signalR.HubConnection>("HubConnection", ["start"]);
            connectionSpy.start.and.rejectWith("test-error");

            spyPropertyGetter(oidcSecurityServiceSpy, 'isAuthenticated$').and.returnValue(new Observable<boolean>((observer) => {
                observer.next(true);
            }));

            spyOn(serviceUnderTest, "reconnect");
            spyOnProperty(serviceUnderTest, "isReconnecting", "get").and.returnValue(false);
            spyOnProperty(serviceUnderTest, "isConnectedToHub", "get").and.returnValue(false);
            spyOnProperty(serviceUnderTest, "connection", "get").and.returnValue(connectionSpy);

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
            const connectionSpy = jasmine.createSpyObj<signalR.HubConnection>("HubConnection", ["start"]);

            spyPropertyGetter(oidcSecurityServiceSpy, 'isAuthenticated$').and.returnValue(new Observable<boolean>((observer) => {
                observer.next(true);
            }));

            spyOn(serviceUnderTest,"reconnect");
            spyOnProperty(serviceUnderTest, "isReconnecting", "get").and.returnValue(true);
            spyOnProperty(serviceUnderTest, "isConnectedToHub", "get").and.returnValue(false);
            spyOnProperty(serviceUnderTest, "connection", "get").and.returnValue(connectionSpy);

            // Act
            serviceUnderTest.start();
            tick();

            // Assert
            expect(connectionSpy.start).not.toHaveBeenCalled();
            expect(serviceUnderTest.reconnect).not.toHaveBeenCalled();
        }));

        it('should NOT try to start the connection if the connection hub is connected', fakeAsync(() => {
            // Arrange
            const connectionSpy = jasmine.createSpyObj<signalR.HubConnection>("HubConnection", ["start"]);

            spyPropertyGetter(oidcSecurityServiceSpy, 'isAuthenticated$').and.returnValue(new Observable<boolean>((observer) => {
                observer.next(true);
            }));

            spyOn(serviceUnderTest,"reconnect");
            spyOnProperty(serviceUnderTest, "isReconnecting", "get").and.returnValue(false);
            spyOnProperty(serviceUnderTest, "isConnectedToHub", "get").and.returnValue(true);
            spyOnProperty(serviceUnderTest, "connection", "get").and.returnValue(connectionSpy);

            // Act
            serviceUnderTest.start();
            tick();

            // Assert
            expect(connectionSpy.start).not.toHaveBeenCalled();
            expect(serviceUnderTest.reconnect).not.toHaveBeenCalled();
        }));

        it('should NOT try to start the connection if the user is NOT authenticated', fakeAsync(() => {
            // Arrange
            const connectionSpy = jasmine.createSpyObj<signalR.HubConnection>("HubConnection", ["start"]);

            spyPropertyGetter(oidcSecurityServiceSpy, 'isAuthenticated$').and.returnValue(new Observable<boolean>((observer) => {
                observer.next(false);
            }));

            spyOn(serviceUnderTest,"reconnect");
            spyOnProperty(serviceUnderTest, "isReconnecting", "get").and.returnValue(false);
            spyOnProperty(serviceUnderTest, "isConnectedToHub", "get").and.returnValue(false);
            spyOnProperty(serviceUnderTest, "connection", "get").and.returnValue(connectionSpy);

            // Act
            serviceUnderTest.start();
            tick();

            // Assert
            expect(connectionSpy.start).not.toHaveBeenCalled();
            expect(serviceUnderTest.reconnect).not.toHaveBeenCalled();
        }));
    });

    describe('reconnect', () => {
        it("should attempt to restart the connection if it has NOT exceeded the number of reconnectionTimes", fakeAsync(() => {
            // Arrange
            const reconnectionTimes = [0, 2000, 5000, 10000, 15000, 20000, 30000];

            spyOn(serviceUnderTest, "start");
            spyOn(serviceUnderTest, "delay").and.callThrough();
            spyOnProperty(serviceUnderTest, "reconnectionAttempt", "get").and.returnValue(1);
            spyOnProperty(serviceUnderTest, "reconnectionTimes", "get").and.returnValue(reconnectionTimes);

            // Act
            serviceUnderTest.reconnect();
            tick();

            // Assert
            expect(serviceUnderTest.delay).toHaveBeenCalledOnceWith(reconnectionTimes[0]);
            expect(serviceUnderTest.start).toHaveBeenCalledTimes(1);
            expect(errorServiceSpy.goToServiceError).not.toHaveBeenCalled();
        }));

        it("should go to the service error page if it has exceded the number of reconnectionTimes", fakeAsync(() => {
            // Arrange
            const reconnectionTimes = [0, 2000, 5000, 10000, 15000, 20000, 30000];

            spyOn(serviceUnderTest, "start");
            spyOn(serviceUnderTest, "delay").and.callThrough();
            spyOnProperty(serviceUnderTest, "reconnectionTimes", "get").and.returnValue(reconnectionTimes);
            spyOnProperty(serviceUnderTest, "reconnectionAttempt", "get").and.returnValue(reconnectionTimes.length + 1);

            // Act
            serviceUnderTest.reconnect();
            tick();

            // Assert
            expect(serviceUnderTest.start).not.toHaveBeenCalled();
            expect(serviceUnderTest.delay).not.toHaveBeenCalled();
            expect(errorServiceSpy.goToServiceError).toHaveBeenCalledTimes(1);
        }));
    });

    describe('stop', () => {
        it('should call connection stop if it is NOT already disconnected', fakeAsync(() => {
            // Arrange
            const connectionSpy = jasmine.createSpyObj<signalR.HubConnection>("HubConnection", ["stop"]);
            connectionSpy.stop.and.rejectWith();

            spyOnProperty(serviceUnderTest, "connection", "get").and.returnValue(connectionSpy);
            spyOnProperty(serviceUnderTest, "isDisconnectedFromHub").and.returnValue(false);

            // Act
            serviceUnderTest.stop();
            tick();

            // Assert
            expect(connectionSpy.stop).toHaveBeenCalledTimes(1);
        }));

        it('should NOT call connection stop if it is already disconnected', fakeAsync(() => {
            // Arrange
            const connectionSpy = jasmine.createSpyObj<signalR.HubConnection>("HubConnection", ["stop"]);
            connectionSpy.stop.and.resolveTo();

            spyOnProperty(serviceUnderTest, "connection", "get").and.returnValue(connectionSpy);
            spyOnProperty(serviceUnderTest, "isDisconnectedFromHub").and.returnValue(true);

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
            spyOn(serviceUnderTest, "start");
            spyOn(serviceUnderTest, "stop");

            // Act
            serviceUnderTest.onConnectionStatusChanged(true);

            // Assert
            expect(serviceUnderTest.start).toHaveBeenCalledTimes(1);
            expect(serviceUnderTest.stop).not.toHaveBeenCalled();
        });

        it('should try to stop the event hub connection when isConnected is false.', () => {
            // Arrange
            spyOn(serviceUnderTest, "start");
            spyOn(serviceUnderTest, "stop");

            // Act
            serviceUnderTest.onConnectionStatusChanged(false);

            // Assert
            expect(serviceUnderTest.start).not.toHaveBeenCalled();
            expect(serviceUnderTest.stop).toHaveBeenCalledTimes(1);
        });

    });
});
