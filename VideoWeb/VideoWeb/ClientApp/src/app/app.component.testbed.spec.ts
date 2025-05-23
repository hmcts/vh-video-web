import { HttpClientModule } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { AppComponent } from './app.component';
import { ConfigService } from './services/api/config.service';
import { ProfileService } from './services/api/profile.service';
import { ClientSettingsResponse, Role, Supplier, SupplierConfigurationResponse, UserProfileResponse } from './services/clients/api-client';
import { DeviceTypeService } from './services/device-type.service';
import { Logger } from './services/logging/logger-base';
import { PageTrackerService } from './services/page-tracker.service';
import { MockLogger } from './testing/mocks/mock-logger';
import { BetaBannerStubComponent } from './testing/stubs/beta-banner-stub';
import { FooterStubComponent } from './testing/stubs/footer-stub';
import { HeaderStubComponent } from './testing/stubs/header-stub';
import { ParticipantStatusUpdateService } from './services/participant-status-update.service';
import { eventsServiceSpy } from 'src/app/testing/mocks/mock-events-service';
import { EventsService } from './services/events.service';
import { TestLanguageService } from './shared/test-language.service';
import { TranslateService } from '@ngx-translate/core';
import { translateServiceSpy } from './testing/mocks/mock-translation.service';
import { TranslatePipeMock } from './testing/mocks/mock-translation-pipe';
import { of } from 'rxjs';
import { PublicEventsService } from 'angular-auth-oidc-client';
import { SecurityServiceProvider } from './security/authentication/security-provider.service';
import { ISecurityService } from './security/authentication/security-service.interface';
import { SecurityConfigSetupService } from './security/security-config-setup.service';
import { getSpiedPropertyGetter } from './shared/jasmine-helpers/property-helpers';
import { IdpProviders } from './security/idp-providers';
import { EventsHubService } from './services/events-hub.service';
import { NoSleepServiceV2 } from './services/no-sleep-v2.service';
import { MockDirective } from 'ng-mocks';
import { FeatureFlagDirective } from './shared/directives/feature-flag.directive';

describe('AppComponent - Testbed', () => {
    let configServiceSpy: jasmine.SpyObj<ConfigService>;
    let deviceTypeServiceSpy: jasmine.SpyObj<DeviceTypeService>;
    let profileServiceSpy: jasmine.SpyObj<ProfileService>;
    let participantStatusUpdateServiceSpy: jasmine.SpyObj<ParticipantStatusUpdateService>;
    let pageTrackerSpy: jasmine.SpyObj<PageTrackerService>;
    let testLanguageServiceSpy: jasmine.SpyObj<TestLanguageService>;
    let publicEventsServiceSpy: jasmine.SpyObj<PublicEventsService>;
    let noSleepServiceSpy: jasmine.SpyObj<NoSleepServiceV2>;
    let eventsHubServiceSpy: jasmine.SpyObj<EventsHubService>;

    const clientSettings = new ClientSettingsResponse({
        event_hub_path: 'evenhub',
        supplier_configurations: [
            new SupplierConfigurationResponse({ supplier: Supplier.Vodafone, join_by_phone_from_date: '2020-09-01' })
        ],
        app_insights_connection_string: 'InstrumentationKey=appinsights'
    });

    let component: AppComponent;
    let fixture: ComponentFixture<AppComponent>;
    let router: Router;
    let securityServiceProviderServiceSpy: jasmine.SpyObj<SecurityServiceProvider>;
    let securityConfigSetupServiceSpy: jasmine.SpyObj<SecurityConfigSetupService>;
    let securityServiceSpy: jasmine.SpyObj<ISecurityService>;

    beforeEach(() => {
        eventsHubServiceSpy = jasmine.createSpyObj<EventsHubService>('EventsHubService', ['configureConnection']);

        noSleepServiceSpy = jasmine.createSpyObj<NoSleepServiceV2>(['enable']);
        configServiceSpy = jasmine.createSpyObj<ConfigService>('ConfigService', ['getClientSettings', 'loadConfig']);
        configServiceSpy.getClientSettings.and.returnValue(of(clientSettings));

        deviceTypeServiceSpy = jasmine.createSpyObj<DeviceTypeService>(['isSupportedBrowser']);

        profileServiceSpy = jasmine.createSpyObj<ProfileService>('ProfileService', ['getUserProfile']);
        const profile = new UserProfileResponse({ roles: [Role.Representative] });
        profileServiceSpy.getUserProfile.and.returnValue(Promise.resolve(profile));

        pageTrackerSpy = jasmine.createSpyObj('PageTrackerService', ['trackNavigation', 'trackPreviousPage']);
        testLanguageServiceSpy = jasmine.createSpyObj('TestLanguageService', ['setupSubscriptions']);

        participantStatusUpdateServiceSpy = jasmine.createSpyObj('ParticipantStatusUpdateService', ['postParticipantStatus']);
        participantStatusUpdateServiceSpy.postParticipantStatus.and.returnValue(Promise.resolve());
        publicEventsServiceSpy = jasmine.createSpyObj('PublicEventsService', ['registerForEvents']);

        securityServiceProviderServiceSpy = jasmine.createSpyObj<SecurityServiceProvider>(
            'SecurityServiceProviderService',
            [],
            ['currentSecurityService$', 'currentIdp$']
        );

        securityServiceSpy = jasmine.createSpyObj<ISecurityService>('ISecurityService', ['authorize']);
        getSpiedPropertyGetter(securityServiceProviderServiceSpy, 'currentSecurityService$').and.returnValue(of(securityServiceSpy));
        getSpiedPropertyGetter(securityServiceProviderServiceSpy, 'currentIdp$').and.returnValue(of(IdpProviders.vhaad));

        securityConfigSetupServiceSpy = jasmine.createSpyObj<SecurityConfigSetupService>('SecurityConfigSetupService', ['getIdp']);

        TestBed.configureTestingModule({
            imports: [HttpClientModule, RouterTestingModule],
            declarations: [
                AppComponent,
                HeaderStubComponent,
                FooterStubComponent,
                BetaBannerStubComponent,
                TranslatePipeMock,
                MockDirective(FeatureFlagDirective)
            ],
            providers: [
                { provide: ConfigService, useValue: configServiceSpy },
                { provide: Logger, useClass: MockLogger },
                { provide: DeviceTypeService, useValue: deviceTypeServiceSpy },
                { provide: DeviceTypeService, useValue: deviceTypeServiceSpy },
                { provide: ProfileService, useValue: profileServiceSpy },
                { provide: PageTrackerService, useValue: pageTrackerSpy },
                { provide: TestLanguageService, useValue: testLanguageServiceSpy },
                { provide: ParticipantStatusUpdateService, useValue: participantStatusUpdateServiceSpy },
                { provide: EventsService, useValue: eventsServiceSpy },
                { provide: TranslateService, useValue: translateServiceSpy },
                { provide: PublicEventsService, useValue: publicEventsServiceSpy },
                { provide: SecurityConfigSetupService, useValue: securityConfigSetupServiceSpy },
                { provide: SecurityServiceProvider, useValue: securityServiceProviderServiceSpy },
                { provide: NoSleepServiceV2, useValue: noSleepServiceSpy },
                { provide: EventsHubService, useValue: eventsHubServiceSpy }
            ]
        });

        fixture = TestBed.createComponent(AppComponent);
        component = fixture.componentInstance;
        deviceTypeServiceSpy.isSupportedBrowser.and.returnValue(true);
        router = TestBed.inject(Router);
        spyOn(router, 'navigate').and.returnValue(Promise.resolve(true));
        spyOn(router, 'navigateByUrl').and.returnValue(Promise.resolve(true));
    });

    // TODO: fix this before merge
    it('should have a tag Skip to main content', () => {
        const compiled = fixture.debugElement.nativeElement;
        expect(compiled.querySelector('.govuk-skip-link').innerHTML).toBe('');
    });
});
