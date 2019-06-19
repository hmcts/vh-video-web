import { TestBed } from '@angular/core/testing';
import { ConfigService } from './config.service';
import { ApiClient, ClientSettingsResponse } from '../clients/api-client';
import { Observable } from 'rxjs';
import { SharedModule } from '../../shared/shared.module';

describe('config service', () => {
  let apiClientSpy: jasmine.SpyObj<ApiClient>;
  let clientSettings: ClientSettingsResponse;
  let configService: ConfigService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [SharedModule],
      providers: [ConfigService, { provide: ApiClient, useValue: apiClientSpy }]
    });
    apiClientSpy = jasmine.createSpyObj<ApiClient>('ApiClient', ['getClientConfigurationSettings']);
    clientSettings = new ClientSettingsResponse();
    clientSettings.tenant_id = 'tenantId';
    clientSettings.client_id = 'clientId';
    clientSettings.post_logout_redirect_uri = '/dashboard';
    clientSettings.redirect_uri = '/dashboard';
    apiClientSpy.getClientConfigurationSettings.and.returnValue(Observable.create(clientSettings));
    configService = TestBed.get(ConfigService);
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  it('should not have called method on api client', () => {
    sessionStorage.setItem('clientSettings', JSON.stringify(clientSettings));
    configService.getClientSettings();
    expect(apiClientSpy.getClientConfigurationSettings).not.toHaveBeenCalled();
  });
});
