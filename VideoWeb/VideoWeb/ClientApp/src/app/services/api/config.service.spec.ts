import { HttpBackend, HttpResponse } from '@angular/common/http';
import { fakeAsync, tick } from '@angular/core/testing';
import { of } from 'rxjs';
import { ClientSettingsResponse } from '../clients/api-client';
import { SessionStorage } from '../session-storage';
import { ConfigService } from './config.service';

describe('ConfigService', () => {
    let httpBackendSpy: jasmine.SpyObj<HttpBackend>;
    let clientSettings: ClientSettingsResponse;
    let configService: ConfigService;
    let clientSettingCache: SessionStorage<ClientSettingsResponse>;

    beforeEach(() => {
        httpBackendSpy = jasmine.createSpyObj<HttpBackend>('HttpBackend', ['handle']);
        clientSettingCache = new SessionStorage<ClientSettingsResponse>('vh.client.settings');
        clientSettings = new ClientSettingsResponse();
        clientSettings.tenant_id = 'tenantId';
        clientSettings.client_id = 'clientId';
        clientSettings.post_logout_redirect_uri = '/dashboard';
        clientSettings.redirect_uri = '/dashboard';
        httpBackendSpy.handle.and.returnValue(of(new HttpResponse({ body: clientSettings })));
        configService = new ConfigService(httpBackendSpy);
    });

    afterEach(() => {
        clientSettingCache.clear();
    });

    it('should have called method on httpClient', fakeAsync(() => {
        configService.loadConfig();
        tick();
        configService.getClientSettings().toPromise();
        tick();
        expect(httpBackendSpy.handle).toHaveBeenCalled();
    }));

    it('should not have called method on httpClient', fakeAsync(() => {
        clientSettingCache.set(clientSettings);
        configService.loadConfig();
        tick();
        configService.getClientSettings().toPromise();
        tick();
        expect(httpBackendSpy.handle).not.toHaveBeenCalled();
    }));
});
