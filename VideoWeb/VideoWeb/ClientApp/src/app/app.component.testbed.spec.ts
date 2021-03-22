import { HttpClientModule } from '@angular/common/http';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { configureTestSuite } from 'ng-bullet';
import { AppComponent } from './app.component';
import { ConfigService } from './services/api/config.service';
import { ProfileService } from './services/api/profile.service';
import { ClientSettingsResponse, Role, UserProfileResponse } from './services/clients/api-client';
import { DeviceTypeService } from './services/device-type.service';
import { LocationService } from './services/location.service';
import { Logger } from './services/logging/logger-base';
import { PageTrackerService } from './services/page-tracker.service';
import { MockLogger } from './testing/mocks/MockLogger';
import { BetaBannerStubComponent } from './testing/stubs/beta-banner-stub';
import { FooterStubComponent } from './testing/stubs/footer-stub';
import { HeaderStubComponent } from './testing/stubs/header-stub';
import { ParticipantStatusUpdateService } from './services/participant-status-update.service';
import { eventsServiceSpy } from 'src/app/testing/mocks/mock-events-service';
import { EventsService } from './services/events.service';
import { TestLanguageService } from './shared/test-language.service';
import { TranslateService } from '@ngx-translate/core';
import { translateServiceSpy } from './testing/mocks/mock-translation-service';
import { OidcSecurityService } from 'angular-auth-oidc-client';
import { MockOidcSecurityService } from './testing/mocks/MockOidcSecurityService';
import { TranslatePipeMock } from './testing/mocks/mock-translation-pipe';

describe('AppComponent', () => {
    let configServiceSpy: jasmine.SpyObj<ConfigService>;
    let deviceTypeServiceSpy: jasmine.SpyObj<DeviceTypeService>;
    let profileServiceSpy: jasmine.SpyObj<ProfileService>;
    let locationServiceSpy: jasmine.SpyObj<LocationService>;
    let participantStatusUpdateServiceSpy: jasmine.SpyObj<ParticipantStatusUpdateService>;
    let pageTrackerSpy: jasmine.SpyObj<PageTrackerService>;
    let testLanguageServiceSpy: jasmine.SpyObj<TestLanguageService>;

    const clientSettings = new ClientSettingsResponse({
        tenant_id: 'tenantid',
        client_id: 'clientid',
        post_logout_redirect_uri: '/logout',
        redirect_uri: '/home',
        video_api_url: 'http://vh-video-api/'
    });

    let component: AppComponent;
    let fixture: ComponentFixture<AppComponent>;
    let router: Router;

    configureTestSuite(() => {
        configServiceSpy = jasmine.createSpyObj<ConfigService>('ConfigService', ['clientSettings', 'getClientSettings', 'loadConfig']);
        configServiceSpy.getClientSettings.and.returnValue(clientSettings);

        deviceTypeServiceSpy = jasmine.createSpyObj<DeviceTypeService>(['isSupportedBrowser']);

        profileServiceSpy = jasmine.createSpyObj<ProfileService>('ProfileService', ['getUserProfile']);
        const profile = new UserProfileResponse({ role: Role.Representative });
        profileServiceSpy.getUserProfile.and.returnValue(Promise.resolve(profile));

        locationServiceSpy = jasmine.createSpyObj<LocationService>('LocationService', ['getCurrentUrl', 'getCurrentPathName']);
        pageTrackerSpy = jasmine.createSpyObj('PageTrackerService', ['trackNavigation', 'trackPreviousPage']);
        testLanguageServiceSpy = jasmine.createSpyObj('TestLanguageService', ['setupSubscriptions']);

        participantStatusUpdateServiceSpy = jasmine.createSpyObj('ParticipantStatusUpdateService', ['postParticipantStatus']);
        participantStatusUpdateServiceSpy.postParticipantStatus.and.returnValue(Promise.resolve());

        TestBed.configureTestingModule({
            imports: [HttpClientModule, RouterTestingModule],
            declarations: [AppComponent, HeaderStubComponent, FooterStubComponent, BetaBannerStubComponent, TranslatePipeMock],
            providers: [
                { provide: ConfigService, useValue: configServiceSpy },
                { provide: Logger, useClass: MockLogger },
                { provide: OidcSecurityService, useClass: MockOidcSecurityService },
                { provide: DeviceTypeService, useValue: deviceTypeServiceSpy },
                { provide: DeviceTypeService, useValue: deviceTypeServiceSpy },
                { provide: ProfileService, useValue: profileServiceSpy },
                { provide: LocationService, useValue: locationServiceSpy },
                { provide: PageTrackerService, useValue: pageTrackerSpy },
                { provide: TestLanguageService, useValue: testLanguageServiceSpy },
                { provide: ParticipantStatusUpdateService, useValue: participantStatusUpdateServiceSpy },
                { provide: EventsService, useValue: eventsServiceSpy },
                { provide: TranslateService, useValue: translateServiceSpy }
            ]
        });
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(AppComponent);
        component = fixture.componentInstance;
        deviceTypeServiceSpy.isSupportedBrowser.and.returnValue(true);
        router = TestBed.inject(Router);
        spyOn(router, 'navigate').and.returnValue(Promise.resolve(true));
        spyOn(router, 'navigateByUrl').and.returnValue(Promise.resolve(true));
    });

    it('should have a tag Skip to main content', () => {
        const compiled = fixture.debugElement.nativeElement;
        expect(compiled.querySelector('.govuk-skip-link').innerHTML).toBe('');
    });
});
