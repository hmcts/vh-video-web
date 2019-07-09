import { HttpClientModule } from '@angular/common/http';
import { async, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { AdalService } from 'adal-angular4';
import { configureTestSuite } from 'ng-bullet';
import { AppComponent } from './app.component';
import { ConfigService } from './services/api/config.service';
import { ClientSettingsResponse } from './services/clients/api-client';
import { Logger } from './services/logging/logger-base';
import { FooterStubComponent } from './testing/stubs/footer-stub';
import { HeaderStubComponent } from './testing/stubs/header-stub';
import { SnotifyStubComponent } from './testing/stubs/snotify-stub';
import { MockLogger } from './testing/mocks/MockLogger';

describe('AppComponent', () => {
  const router = {
    navigate: jasmine.createSpy('navigate')
  };

  let configServiceSpy: jasmine.SpyObj<ConfigService>;
  let adalServiceSpy: jasmine.SpyObj<AdalService>;

  const clientSettings = new ClientSettingsResponse({
    tenant_id: 'tenantid',
    client_id: 'clientid',
    post_logout_redirect_uri: '/logout',
    redirect_uri: '/home',
    video_api_url: 'http://vh-video-api/'
  });

  const userInfo = {
    authenticated: false,
    userName: 'chris.green@hearings.net',
    token: 'token'
  };

  configureTestSuite(() => {
    configServiceSpy = jasmine.createSpyObj<ConfigService>('ConfigService', ['clientSettings', 'getClientSettings', 'loadConfig']);
    configServiceSpy.getClientSettings.and.returnValue(clientSettings);

    adalServiceSpy = jasmine.createSpyObj<AdalService>('AdalService', ['init', 'handleWindowCallback', 'userInfo']);
    adalServiceSpy.userInfo.and.returnValue(userInfo);
    TestBed.configureTestingModule({
      imports: [HttpClientModule, RouterTestingModule],
      declarations: [
        AppComponent,
        HeaderStubComponent,
        FooterStubComponent,
        SnotifyStubComponent
      ],
      providers:
        [
          { provide: AdalService, useValue: adalServiceSpy },
          { provide: ConfigService, useValue: configServiceSpy },
          { provide: Router, useValue: router },
          { provide: Logger, useClass: MockLogger }
        ],
    });
  });

  it('should create the app', async(() => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.debugElement.componentInstance;
    expect(app).toBeTruthy();
  }));
});
