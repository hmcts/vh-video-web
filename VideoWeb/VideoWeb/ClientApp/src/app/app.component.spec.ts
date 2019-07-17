import { HttpClientModule } from '@angular/common/http';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { AdalService } from 'adal-angular4';
import { configureTestSuite } from 'ng-bullet';
import { AppComponent } from './app.component';
import { ConfigService } from './services/api/config.service';
import { ClientSettingsResponse } from './services/clients/api-client';
import { DeviceTypeService } from './services/device-type.service';
import { Logger } from './services/logging/logger-base';
import { PageUrls } from './shared/page-url.constants';
import { MockLogger } from './testing/mocks/MockLogger';
import { FooterStubComponent } from './testing/stubs/footer-stub';
import { HeaderStubComponent } from './testing/stubs/header-stub';
import { SnotifyStubComponent } from './testing/stubs/snotify-stub';
import { Component } from '@angular/core';

@Component({ selector: 'app-beta-banner', template: '' })
export class BetaBannerStubComponent { }

describe('AppComponent', () => {
  let configServiceSpy: jasmine.SpyObj<ConfigService>;
  let adalServiceSpy: jasmine.SpyObj<AdalService>;
  let deviceTypeServiceSpy: jasmine.SpyObj<DeviceTypeService>;

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

  let component: AppComponent;
  let fixture: ComponentFixture<AppComponent>;
  let router: Router;

  configureTestSuite(() => {
    configServiceSpy = jasmine.createSpyObj<ConfigService>('ConfigService', ['clientSettings', 'getClientSettings', 'loadConfig']);
    configServiceSpy.getClientSettings.and.returnValue(clientSettings);

    adalServiceSpy = jasmine.createSpyObj<AdalService>('AdalService', ['init', 'handleWindowCallback', 'userInfo', 'logOut']);
    adalServiceSpy.userInfo.and.returnValue(userInfo);

    deviceTypeServiceSpy = jasmine.createSpyObj<DeviceTypeService>(['isSupportedBrowser']);

    TestBed.configureTestingModule({
      imports: [HttpClientModule, RouterTestingModule],
      declarations: [
        AppComponent,
        HeaderStubComponent,
        FooterStubComponent,
        SnotifyStubComponent,
        BetaBannerStubComponent
      ],
      providers:
        [
          { provide: AdalService, useValue: adalServiceSpy },
          { provide: ConfigService, useValue: configServiceSpy },
          { provide: Logger, useClass: MockLogger },
          { provide: DeviceTypeService, useValue: deviceTypeServiceSpy }
        ],
    });
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AppComponent);
    component = fixture.componentInstance;
    deviceTypeServiceSpy.isSupportedBrowser.and.returnValue(true);
    router = TestBed.get(Router);
    spyOn(router, 'navigate').and.returnValue(true);
    spyOn(router, 'navigateByUrl').and.returnValue(true);
  });

  it('should prompt user to login if not authenticated', () => {
    component.ngOnInit();
    expect(router.navigate).toHaveBeenCalled();
  });

  it('should navigate to unsupported browser page if browser is not compatible', () => {
    deviceTypeServiceSpy.isSupportedBrowser.and.returnValue(false);
    component.checkBrowser();
    expect(router.navigateByUrl).toHaveBeenCalledWith(PageUrls.UnsupportedBrowser);
  });

  it('should allow user to continue on a supported browser', () => {
    deviceTypeServiceSpy.isSupportedBrowser.and.returnValue(true);
    component.checkBrowser();
    expect(router.navigateByUrl).toHaveBeenCalledTimes(0);
  });

  it('should log out of adal', () => {
    component.logOut();
    expect(component.loggedIn).toBeFalsy();
    expect(adalServiceSpy.logOut).toHaveBeenCalled();
  });
});
