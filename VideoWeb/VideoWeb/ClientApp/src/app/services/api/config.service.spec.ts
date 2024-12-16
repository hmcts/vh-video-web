import { HttpBackend, HttpResponse } from '@angular/common/http';
import { fakeAsync, tick } from '@angular/core/testing';
import { of } from 'rxjs';
import { ClientSettingsResponse, IdpSettingsResponse } from '../clients/api-client';
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
        const ejudSettings = new IdpSettingsResponse({
            client_id: 'ejudClient',
            tenant_id: 'ejudTenant',
            redirect_uri: '/home',
            post_logout_redirect_uri: '/logout'
        });

        const vhAdSettings = new IdpSettingsResponse({
            client_id: 'vhClient',
            tenant_id: 'vhTenant',
            redirect_uri: '/home',
            post_logout_redirect_uri: '/logout'
        });
        clientSettings.e_jud_idp_settings = ejudSettings;
        clientSettings.vh_idp_settings = vhAdSettings;
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
