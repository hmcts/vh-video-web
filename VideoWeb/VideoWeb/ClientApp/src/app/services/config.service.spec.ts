import { TestBed } from '@angular/core/testing';
import { HttpClientModule } from '@angular/common/http';
import { ConfigService } from './config.service';
import { ApiClient, ClientSettingsResponse } from '../services/clients/api-client';
import { Observable } from 'rxjs';

describe('config service', () => {
  let bhClientSpy: jasmine.SpyObj<ApiClient>;
  let clientSettings: ClientSettingsResponse;
  let configService: ConfigService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientModule],
      providers: [ConfigService, { provide: ApiClient, useValue: bhClientSpy }]
    });
    bhClientSpy = jasmine.createSpyObj<ApiClient>('ApiClient', ['getConfigSettings']);
    clientSettings = new ClientSettingsResponse();
    clientSettings.tenant_id = 'tenantId';
    clientSettings.client_id = 'clientId';
    clientSettings.post_logout_redirect_uri = '/dashboard';
    clientSettings.redirect_uri = '/dashboard';
    bhClientSpy.getConfigSettings.and.returnValue(Observable.create(clientSettings));
    configService = TestBed.get(ConfigService);
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  it('should not have called method on api client', () => {
    sessionStorage.setItem('clientSettings', JSON.stringify(clientSettings));
    configService.getClientSettings();
    expect(bhClientSpy.getConfigSettings).not.toHaveBeenCalled();
  });
});
