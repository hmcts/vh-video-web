import * as signalR from '@microsoft/signalr';
import { Guid } from 'guid-typescript';
import { of, Subscription } from 'rxjs';
import { MockOidcSecurityService } from '../testing/mocks/mock-oidc-security.service';
import { MockLogger } from '../testing/mocks/mock-logger';
import { ConfigService } from './api/config.service';
import { ClientSettingsResponse } from './clients/api-client';
import { EventsService } from './events.service';
import { Logger } from './logging/logger-base';
import { InstantMessage } from './models/instant-message';
import { ErrorService } from '../services/error.service';
import { fakeAsync, tick } from '@angular/core/testing';

describe('EventsService', () => {
    const clientSettings = new ClientSettingsResponse({
        tenant_id: 'tenantid',
        client_id: 'clientid',
        post_logout_redirect_uri: '/logout',
        redirect_uri: '/home',
        video_api_url: 'http://vh-video-api/',
        event_hub_path: 'eventhub-karma-tests'
    });
    let configServiceSpy: jasmine.SpyObj<ConfigService>;
    let errorServiceSpy: jasmine.SpyObj<ErrorService>;
    let service: EventsService;
    const mockOidcSecurityService = new MockOidcSecurityService();
    let oidcSecurityService;
    const logger: Logger = new MockLogger();

    const subscription$ = new Subscription();

    beforeAll(() => {
        configServiceSpy = jasmine.createSpyObj<ConfigService>('ConfigService', ['getClientSettings', 'loadConfig']);
        errorServiceSpy = jasmine.createSpyObj<ErrorService>('ErrorService', ['handleApiError', 'goToUnauthorised', 'goToServiceError']);
        configServiceSpy.getClientSettings.and.returnValue(of(clientSettings));
        oidcSecurityService = mockOidcSecurityService;
        service = new EventsService(oidcSecurityService, configServiceSpy, logger, errorServiceSpy);

        service.connection = new signalR.HubConnectionBuilder()
            .configureLogging(signalR.LogLevel.Debug)
            .withAutomaticReconnect([0])
            .withUrl('eventhub-karma-tests', {
                accessTokenFactory: () => mockOidcSecurityService.getToken()
            })
            .build();
    });

    afterEach(() => {
        subscription$.unsubscribe();
        service.reconnectionPromise = null;
    });

    it('should init observables', () => {
        subscription$.add(service.getServiceReconnected().subscribe());
        subscription$.add(service.getServiceDisconnected().subscribe());
        subscription$.add(service.getParticipantStatusMessage().subscribe());
        subscription$.add(service.getHearingStatusMessage().subscribe());
        subscription$.add(service.getConsultationRequestResponseMessage().subscribe());
        subscription$.add(service.getChatMessage().subscribe());
        subscription$.add(service.getAdminAnsweredChat().subscribe());
        subscription$.add(service.getHeartbeat().subscribe());
        expect(subscription$).toBeTruthy();
    });

    it('should start if not connected', fakeAsync(() => {
        mockOidcSecurityService.setAuthenticated(true);
        spyOn(service.connection, 'start').and.callFake(() => Promise.resolve());
        service.start();
        tick();
        expect(service.reconnectionAttempt).toBe(0);
    }));

    it('should retry to connect on failure', fakeAsync(() => {
        mockOidcSecurityService.setAuthenticated(true);
        service.reconnectionAttempt = 0;
        spyOn(service.connection, 'start').and.returnValues(Promise.reject('Unable to connect auto test'), Promise.resolve());
        subscription$.add(service.getServiceDisconnected().subscribe());
        service.start();
        tick();
        expect(service.reconnectionAttempt).toBe(0);
        expect(service.connection.start).toHaveBeenCalledTimes(2);
    }));

    it('should goto service error on 8th failure', fakeAsync(() => {
        mockOidcSecurityService.setAuthenticated(true);
        service.reconnectionTimes[6] = 0;
        service.reconnectionAttempt = 7;
        spyOn(service.connection, 'start').and.returnValues(Promise.reject('Unable to connect auto test'));
        subscription$.add(service.getServiceDisconnected().subscribe());
        service.start();
        tick();
        expect(errorServiceSpy.goToServiceError).toHaveBeenCalledWith('Your connection was lost');
    }));

    it('should not start if connected', fakeAsync(() => {
        mockOidcSecurityService.setAuthenticated(true);
        const spy = spyOnProperty(service.connection, 'state').and.returnValue(signalR.HubConnectionState.Disconnected);
        spyOn(service.connection, 'start').and.callFake(() => {
            spy.and.returnValue(signalR.HubConnectionState.Connected);
            return Promise.resolve();
        });
        service.start();
        tick();
        service.start();
        tick();
        expect(service.connection.start).toHaveBeenCalledTimes(1);
    }));

    it('should not start if in Disconnecting stat', fakeAsync(() => {
        mockOidcSecurityService.setAuthenticated(true);
        const spy = spyOnProperty(service.connection, 'state').and.returnValue(signalR.HubConnectionState.Disconnecting);
        spyOn(service.connection, 'start').and.callFake(() => {
            spy.and.returnValue(signalR.HubConnectionState.Disconnecting);
            return Promise.resolve();
        });
        service.start();
        tick();
        service.start();
        tick();
        expect(service.connection.start).toHaveBeenCalledTimes(0);
    }));

    it('should stop eventhub connection if connected to eventhub', () => {
        spyOn(service.connection, 'stop').and.callFake(() => Promise.resolve());
        spyOnProperty(service.connection, 'state').and.returnValue(signalR.HubConnectionState.Connected);
        service.stop();
        expect(service.connection.stop).toHaveBeenCalled();
    });

    it('should not stop eventhub connection if not connected to eventhub', () => {
        spyOn(service.connection, 'stop');
        spyOnProperty(service.connection, 'state').and.returnValue(signalR.HubConnectionState.Disconnected);
        expect(service.connection.stop).toHaveBeenCalledTimes(0);
    });

    it('should not stop eventhub connection if eventhub already in the disconnecting state', () => {
        spyOn(service.connection, 'stop');
        spyOnProperty(service.connection, 'state').and.returnValue(signalR.HubConnectionState.Disconnecting);
        expect(service.connection.stop).toHaveBeenCalledTimes(0);
    });
    it('should send im to "SendMessage" method', async () => {
        const imTest = new InstantMessage({
            conferenceId: Guid.create().toString(),
            id: Guid.create().toString(),
            to: 'test@to.com',
            from: 'other@from.com',
            from_display_name: 'You',
            message: 'i have sent',
            is_user: true,
            timestamp: new Date(new Date().toUTCString())
        });
        spyOn(service.connection, 'send');
        await service.sendMessage(imTest);

        expect(service.connection.send).toHaveBeenCalledWith('SendMessage', imTest.conferenceId, imTest.message, imTest.to, imTest.id);
    });

    it('should not reconnect if signalR disonnected and user is not logged in', fakeAsync(() => {
        mockOidcSecurityService.setAuthenticated(false);
        const spy = spyOnProperty(service.connection, 'state').and.returnValue(signalR.HubConnectionState.Disconnected);
        spyOn(service.connection, 'start').and.callFake(() => {
            spy.and.returnValue(signalR.HubConnectionState.Connected);
            return Promise.resolve();
        });
        service.start();
        tick();
        service.start();
        tick();
        expect(service.connection.start).toHaveBeenCalledTimes(0);
    }));
});
