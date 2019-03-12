import { HttpClientModule } from '@angular/common/http';
import { async, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { AdalService } from 'adal-angular4';

import { AppComponent } from './app.component';
import { ClientSettingsResponse } from './services/clients/api-client';
import { ConfigService } from './services/config.service';
import { FooterStubComponent } from './testing/stubs/footer-stub';
import { HeaderStubComponent } from './testing/stubs/header-stub';

describe('AppComponent', () => {
  const router = {
    navigate: jasmine.createSpy('navigate')
  };

  let configServiceSpy: jasmine.SpyObj<ConfigService>;
  let adalServiceSpy: jasmine.SpyObj<AdalService>;

  const clientSettings = new ClientSettingsResponse({
    tenant_id: 'tenantid',
    client_id: 'clientid',
    post_logout_redirect_uri: '/dashboard',
    redirect_uri: '/dashboard'
  });

  const userInfo = {
    authenticated: false,
    userName: 'test@automated.com',
    token: 'token'
  };

  beforeEach(async(() => {
    configServiceSpy = jasmine.createSpyObj<ConfigService>('ConfigService', ['clientSettings', 'getClientSettings', 'loadConfig']);
    configServiceSpy.clientSettings.and.returnValue(clientSettings);

    adalServiceSpy = jasmine.createSpyObj<AdalService>('AdalService', ['init', 'handleWindowCallback', 'userInfo']);
    adalServiceSpy.userInfo.and.returnValue(userInfo);
    TestBed.configureTestingModule({
      imports: [HttpClientModule, RouterTestingModule],
      declarations: [
        AppComponent,
        HeaderStubComponent,
        FooterStubComponent,
      ],
      providers:
        [
          { provide: AdalService, useValue: adalServiceSpy },
          { provide: ConfigService, useValue: configServiceSpy },
          { provide: Router, useValue: router }
        ],
    }).compileComponents();
  }));
  it('should create the app', async(() => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.debugElement.componentInstance;
    expect(app).toBeTruthy();
  }));
});
