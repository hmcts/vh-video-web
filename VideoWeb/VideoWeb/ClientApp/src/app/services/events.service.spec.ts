import * as signalR from '@microsoft/signalr';
import { Guid } from 'guid-typescript';
import { Subscription } from 'rxjs';
import { MockAdalService } from '../testing/mocks/MockAdalService';
import { MockLogger } from '../testing/mocks/MockLogger';
import { ConfigService } from './api/config.service';
import { ClientSettingsResponse } from './clients/api-client';
import { EventsService } from './events.service';
import { Logger } from './logging/logger-base';
import { InstantMessage } from './models/instant-message';

describe('EventsService', () => {
    const clientSettings = new ClientSettingsResponse({
        tenant_id: 'tenantid',
        client_id: 'clientid',
        post_logout_redirect_uri: '/logout',
        redirect_uri: '/home',
        video_api_url: 'http://vh-video-api/',
        event_hub_path: 'eventhub-karma-tests'
    });
    let configService: jasmine.SpyObj<ConfigService>;
    let service: EventsService;
    const mockAdalService = new MockAdalService();
    let adalService;
    const logger: Logger = new MockLogger();
    const subscription$ = new Subscription();

    beforeAll(() => {
        configService = jasmine.createSpyObj<ConfigService>('ConfigService', ['clientSettings', 'getClientSettings', 'loadConfig']);
        configService.getClientSettings.and.returnValue(clientSettings);
        adalService = mockAdalService;
        service = new EventsService(adalService, configService, logger);

        service.connection = new signalR.HubConnectionBuilder()
            .configureLogging(signalR.LogLevel.Debug)
            .withAutomaticReconnect([0])
            .withUrl('eventhub-karma-tests', {
                accessTokenFactory: () => mockAdalService.userInfo.token
            })
            .build();
    });

    afterEach(() => subscription$.unsubscribe());

    it('should init observables', () => {
        subscription$.add(service.getServiceReconnected().subscribe());
        subscription$.add(service.getServiceDisconnected().subscribe());
        subscription$.add(service.getParticipantStatusMessage().subscribe());
        subscription$.add(service.getHearingStatusMessage().subscribe());
        subscription$.add(service.getConsultationMessage().subscribe());
        subscription$.add(service.getAdminConsultationMessage().subscribe());
        subscription$.add(service.getChatMessage().subscribe());
        subscription$.add(service.getAdminAnsweredChat().subscribe());
        subscription$.add(service.getHeartbeat().subscribe());
        expect(subscription$).toBeTruthy();
    });

    it('should start if not connected', async () => {
        spyOn(service.connection, 'start').and.callFake(() => Promise.resolve());
        await service.start();
        expect(service.reconnectionAttempt).toBe(0);
    });

    it('should retry to connect on failure', async () => {
        service.reconnectionAttempt = 0;
        service.retryDelayTime = 1;
        spyOn(service.connection, 'start').and.returnValues(Promise.reject('Unable to connect auto test'), Promise.resolve());
        subscription$.add(service.getServiceDisconnected().subscribe());
        await service.start();
        expect(service.reconnectionAttempt).toBe(0);
        expect(service.connection.start).toHaveBeenCalledTimes(2);
    });

    it('should not start if connected', () => {
        const spy = spyOnProperty(service.connection, 'state').and.returnValue(signalR.HubConnectionState.Disconnected);
        spyOn(service.connection, 'start').and.callFake(() => {
            spy.and.returnValue(signalR.HubConnectionState.Connected);
            return Promise.resolve();
        });
        service.start();
        service.start();
        expect(service.connection.start).toHaveBeenCalledTimes(1);
    });

    it('should stop', () => {
        spyOn(service.connection, 'stop').and.callFake(() => Promise.resolve());
        service.stop();
        expect(service.connection.stop).toHaveBeenCalled();
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
});
