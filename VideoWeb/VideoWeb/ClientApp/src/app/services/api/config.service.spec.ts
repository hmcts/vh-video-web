import { HttpClient } from '@angular/common/http';
import { fakeAsync, tick } from '@angular/core/testing';
import { of } from 'rxjs';
import { ClientSettingsResponse } from '../clients/api-client';
import { SessionStorage } from '../session-storage';
import { ConfigService } from './config.service';

describe('ConfigService', () => {
    let httpClientSpy: jasmine.SpyObj<HttpClient>;
    let clientSettings: ClientSettingsResponse;
    let configService: ConfigService;
    let clientSettingCache: SessionStorage<ClientSettingsResponse>;

    beforeEach(() => {
        clientSettingCache = new SessionStorage<ClientSettingsResponse>('vh.client.settings');

        httpClientSpy = jasmine.createSpyObj<HttpClient>('HttpClient', ['get']);

        clientSettings = new ClientSettingsResponse();
        clientSettings.tenant_id = 'tenantId';
        clientSettings.client_id = 'clientId';
        clientSettings.post_logout_redirect_uri = '/dashboard';
        clientSettings.redirect_uri = '/dashboard';
        httpClientSpy.get.and.returnValue(of(clientSettings));

        configService = new ConfigService(httpClientSpy);
    });

    afterEach(() => {
        clientSettingCache.clear();
    });

    it('should have called method on httpClient', fakeAsync(() => {
        configService.loadConfig();
        tick();
        configService.getClientSettingsObservable().toPromise();
        tick();
        expect(httpClientSpy.get).toHaveBeenCalled();
    }));

    it('should not have called method on httpClient', fakeAsync(() => {
        clientSettingCache.set(clientSettings);
        configService.loadConfig();
        tick();
        configService.getClientSettingsObservable().toPromise();
        tick();
        expect(httpClientSpy.get).not.toHaveBeenCalled();
    }));
});
