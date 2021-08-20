import { ElementRef } from '@angular/core';
import { fakeAsync, flushMicrotasks, tick, flush, ComponentFixture, waitForAsync, TestBed } from '@angular/core/testing';
import { By, Title } from '@angular/platform-browser';
import { ActivatedRoute, Event, NavigationEnd, Router } from '@angular/router';
import { of, Subject, Subscription } from 'rxjs';
import { AppComponent } from './app.component';
import { ConfigService } from './services/api/config.service';
import { ProfileService } from './services/api/profile.service';
import { ClientSettingsResponse, Role, UserProfileResponse } from './services/clients/api-client';
import { DeviceTypeService } from './services/device-type.service';
import { ErrorService } from './services/error.service';
import { PageTrackerService } from './services/page-tracker.service';
import { ConnectionStatusService } from './services/connection-status.service';
import { TestLanguageService } from './shared/test-language.service';
import {
    PublicEventsService,
    OidcClientNotification,
    EventTypes,
    AuthorizationResult,
    AuthorizedState,
    ValidationResult
} from 'angular-auth-oidc-client';
import { MockLogger } from './testing/mocks/mock-logger';
import { SecurityServiceProvider } from './security/authentication/security-provider.service';
import { SecurityConfigSetupService } from './security/security-config-setup.service';
import { getSpiedPropertyGetter } from './shared/jasmine-helpers/property-helpers';
import { ISecurityService } from './security/authentication/security-service.interface';
import { Location } from '@angular/common';
import { pageUrls } from './shared/page-url.constants';
import { BackLinkDetails } from './shared/models/back-link-details';
import { Logger } from './services/logging/logger-base';
import { MockComponent, ngMocks } from 'ng-mocks';
import { BackNavigationComponent } from './shared/back-navigation/back-navigation.component';
import { BetaBannerComponent } from './shared/beta-banner/beta-banner.component';
import { FooterComponent } from './shared/footer/footer.component';
import { HeaderComponent } from './shared/header/header.component';
import { TranslatePipeMock } from './testing/mocks/mock-translation-pipe';
import { TranslateService } from '@ngx-translate/core';
import { RouterTestingModule } from '@angular/router/testing';
import { translateServiceSpy } from './testing/mocks/mock-translation.service';

describe('AppComponent', () => {
    let fixture: ComponentFixture<AppComponent>;
    let component: AppComponent;

    let configServiceSpy: jasmine.SpyObj<ConfigService>;
    let deviceTypeServiceSpy: jasmine.SpyObj<DeviceTypeService>;
    let profileServiceSpy: jasmine.SpyObj<ProfileService>;
    let routerSpy: jasmine.SpyObj<Router>;
    let errorServiceSpy: jasmine.SpyObj<ErrorService>;
    let publicEventsServiceSpy: jasmine.SpyObj<PublicEventsService>;
    let titleServiceSpy: jasmine.SpyObj<Title>;
    let connectionStatusServiceSpy: jasmine.SpyObj<ConnectionStatusService>;
    let pageTrackerServiceSpy: jasmine.SpyObj<PageTrackerService>;
    let testLanguageServiceSpy: jasmine.SpyObj<TestLanguageService>;
    let securityServiceProviderServiceSpy: jasmine.SpyObj<SecurityServiceProvider>;
    let securityConfigSetupServiceSpy: jasmine.SpyObj<SecurityConfigSetupService>;
    let securityServiceSpy: jasmine.SpyObj<ISecurityService>;

    let locationSpy: jasmine.SpyObj<Location>;
    const clientSettings = new ClientSettingsResponse({
        event_hub_path: 'evenhub',
        join_by_phone_from_date: '2020-09-01',
        app_insights_instrumentation_key: 'appinsights'
    });

    let activatedRouteMock: any;
    const eventsSubjects = new Subject<Event>();
    const dummyElement = document.createElement('div');
    const testTitle = 'test-title';
    let eventValue: OidcClientNotification<AuthorizationResult> = {
        type: EventTypes.NewAuthorizationResult,
        value: { isRenewProcess: false, authorizationState: AuthorizedState.Authorized, validationResult: ValidationResult.Ok }
    };

    beforeAll(() => {
        jasmine.getEnv().allowRespy(true);

        activatedRouteMock = {
            firstChild: { snapshot: { data: { title: testTitle } } }
        };

        configServiceSpy = jasmine.createSpyObj<ConfigService>('ConfigService', ['getClientSettings', 'loadConfig']);
        configServiceSpy.getClientSettings.and.returnValue(of(clientSettings));
        deviceTypeServiceSpy = jasmine.createSpyObj<DeviceTypeService>(['isSupportedBrowser']);
        profileServiceSpy = jasmine.createSpyObj<ProfileService>('ProfileService', ['getUserProfile']);
        const profile = new UserProfileResponse({ role: Role.Representative });
        profileServiceSpy.getUserProfile.and.returnValue(Promise.resolve(profile));
        routerSpy = jasmine.createSpyObj<Router>('Router', ['navigate', 'navigateByUrl'], {
            events: eventsSubjects.asObservable()
        });
        errorServiceSpy = jasmine.createSpyObj<ErrorService>('ErrorService', ['handleApiError', 'goToUnauthorised']);
        titleServiceSpy = jasmine.createSpyObj<Title>('Title', ['getTitle', 'setTitle']);
        connectionStatusServiceSpy = jasmine.createSpyObj('ConnectionStatusService', ['start']);
        pageTrackerServiceSpy = jasmine.createSpyObj('PageTrackerService', ['trackNavigation', 'trackPreviousPage']);
        testLanguageServiceSpy = jasmine.createSpyObj('TestLanguageService', ['setupSubscriptions']);
        publicEventsServiceSpy = jasmine.createSpyObj('PublicEventsService', ['registerForEvents']);
        securityServiceSpy = jasmine.createSpyObj<ISecurityService>(
            'ISecurityService',
            ['checkAuth', 'logoffAndRevokeTokens'],
            ['isAuthenticated$']
        );
    });

    afterAll(() => {
        jasmine.getEnv().allowRespy(false);
    });

    beforeEach(
        waitForAsync(() => {
            securityServiceProviderServiceSpy = jasmine.createSpyObj<SecurityServiceProvider>(
                'SecurityServiceProviderService',
                [],
                ['currentSecurityService$']
            );

            spyOnProperty(securityServiceSpy, 'isAuthenticated$', 'get').and.returnValue(of(true));
            getSpiedPropertyGetter(securityServiceProviderServiceSpy, 'currentSecurityService$').and.returnValue(of(securityServiceSpy));

            securityConfigSetupServiceSpy = jasmine.createSpyObj<SecurityConfigSetupService>('SecurityConfigSetupService', ['getIdp'], []);
            locationSpy = jasmine.createSpyObj<Location>('Location', ['back']);

            TestBed.configureTestingModule({
                providers: [
                    { provide: DeviceTypeService, useValue: deviceTypeServiceSpy },
                    { provide: ProfileService, useValue: profileServiceSpy },
                    { provide: ErrorService, useValue: errorServiceSpy },
                    { provide: Title, useValue: titleServiceSpy },
                    { provide: ConnectionStatusService, useValue: connectionStatusServiceSpy },
                    { provide: PageTrackerService, useValue: pageTrackerServiceSpy },
                    { provide: TestLanguageService, useValue: testLanguageServiceSpy },
                    { provide: SecurityServiceProvider, useValue: securityServiceProviderServiceSpy },
                    { provide: SecurityConfigSetupService, useValue: securityConfigSetupServiceSpy },
                    { provide: ConfigService, useValue: configServiceSpy },
                    { provide: PublicEventsService, useValue: publicEventsServiceSpy },
                    { provide: Location, useValue: locationSpy },
                    { provide: Logger, useValue: new MockLogger() },
                    { provide: TranslateService, useValue: translateServiceSpy },
                    { provide: Router, useValue: routerSpy },
                    {
                        provide: ActivatedRoute,
                        useValue: activatedRouteMock
                    }
                ],
                declarations: [
                    AppComponent,
                    TranslatePipeMock,
                    MockComponent(BackNavigationComponent),
                    MockComponent(HeaderComponent),
                    MockComponent(FooterComponent),
                    MockComponent(BetaBannerComponent)
                ],
                imports: [RouterTestingModule]
            }).compileComponents();

            fixture = TestBed.createComponent(AppComponent);
            component = fixture.componentInstance;
            document.getElementById = jasmine.createSpy('HTML Element').and.returnValue(dummyElement);
            component.main = new ElementRef(dummyElement);
            component.skipLinkDiv = new ElementRef(dummyElement);
            deviceTypeServiceSpy.isSupportedBrowser.and.returnValue(true);
            routerSpy.navigate.and.returnValue(Promise.resolve(true));
            routerSpy.navigateByUrl.and.returnValue(Promise.resolve(true));
            routerSpy.navigate.calls.reset();
            routerSpy.navigateByUrl.calls.reset();
            profileServiceSpy.getUserProfile.calls.reset();
            publicEventsServiceSpy.registerForEvents.and.returnValue(of(eventValue));
        })
    );

    it('should start connection status service if authenticated oninit', fakeAsync(() => {
        // Arrange
        const checkAuthSubject = new Subject<boolean>();
        securityServiceSpy.checkAuth.and.returnValue(checkAuthSubject.asObservable());

        eventValue = {
            type: EventTypes.NewAuthorizationResult,
            value: { isRenewProcess: false, authorizationState: AuthorizedState.Authorized, validationResult: ValidationResult.Ok }
        };

        publicEventsServiceSpy.registerForEvents.and.returnValue(of(eventValue));

        // Act
        component.ngOnInit();
        tick();
        flush();

        // Assert
        expect(connectionStatusServiceSpy.start).toHaveBeenCalled();
    }));

    it('should navigate to unsupported browser page if browser is not compatible', () => {
        deviceTypeServiceSpy.isSupportedBrowser.and.returnValue(false);
        component.checkBrowser();
        expect(routerSpy.navigateByUrl).toHaveBeenCalledWith(pageUrls.UnsupportedBrowser);
    });

    it('should allow user to continue on a supported browser', () => {
        deviceTypeServiceSpy.isSupportedBrowser.and.returnValue(true);
        component.checkBrowser();
        expect(routerSpy.navigateByUrl).toHaveBeenCalledTimes(0);
    });

    it('should log out of adal', () => {
        component.securityService = securityServiceSpy;
        component.logOut();
        expect(component.loggedIn).toBeFalsy();
        expect(securityServiceSpy.logoffAndRevokeTokens).toHaveBeenCalled();
    });

    it('should set to true when user profile is a representative', async () => {
        const profile = new UserProfileResponse({ role: Role.Representative });
        profileServiceSpy.getUserProfile.and.returnValue(Promise.resolve(profile));
        await component.retrieveProfileRole();
        expect(component.isRepresentativeOrIndividual).toBeTruthy();
    });

    it('should set to true when user profile is an individual', async () => {
        const profile = new UserProfileResponse({ role: Role.Individual });
        profileServiceSpy.getUserProfile.and.returnValue(Promise.resolve(profile));
        await component.retrieveProfileRole();
        expect(component.isRepresentativeOrIndividual).toBeTruthy();
    });

    it('should set to false when user profile is a judge', async () => {
        const profile = new UserProfileResponse({ role: Role.Judge });
        profileServiceSpy.getUserProfile.and.returnValue(Promise.resolve(profile));
        await component.retrieveProfileRole();
        expect(component.isRepresentativeOrIndividual).toBeFalsy();
    });

    it('should send user to unauthorised page when profile cannot be found', async () => {
        const error = { status: 401, isApiException: true };
        profileServiceSpy.getUserProfile.and.returnValue(Promise.reject(error));
        await component.retrieveProfileRole();
        expect(errorServiceSpy.goToUnauthorised).toHaveBeenCalled();
    });

    it('should retrieve profile when on not on logout and authenticated', async () => {
        await component.ngOnInit();
        expect(profileServiceSpy.getUserProfile).toHaveBeenCalled();
    });

    it('should not check auth or get profile on logout', async () => {
        component.securityService = securityServiceSpy;
        await component.checkAuth();
        expect(routerSpy.navigate).toHaveBeenCalledTimes(0);
        expect(profileServiceSpy.getUserProfile).toHaveBeenCalledTimes(0);
    });

    describe('NavigationEndEvent', () => {
        const navEvent = new NavigationEnd(1, 'url', 'urlAfterRedirects');

        it('should update page title is naviation event raised', fakeAsync(() => {
            const testTitlePrefix = 'Test Title Prefix';
            titleServiceSpy.getTitle.and.returnValue(testTitlePrefix);
            component.setupNavigationSubscriptions();
            eventsSubjects.next(navEvent);
            tick();
            flushMicrotasks();
            expect(titleServiceSpy.setTitle).toHaveBeenCalledWith(testTitlePrefix + ' - ' + testTitle);
        }));

        describe('backLinkDetails$', () => {
            it('should update backLinkDetails$ value as undefined when none present', fakeAsync(() => {
                component.setupNavigationSubscriptions();
                eventsSubjects.next(navEvent);
                tick();
                flushMicrotasks();
                expect(component.backLinkDetails$.value).toBe(undefined);
            }));

            it('should update backLinkDetails$ value as null when none present', fakeAsync(() => {
                const testBackLinkDetails = new BackLinkDetails();
                activatedRouteMock.firstChild.snapshot.data['backLink'] = testBackLinkDetails;
                component.setupNavigationSubscriptions();
                eventsSubjects.next(navEvent);
                tick();
                flushMicrotasks();
                expect(component.backLinkDetails$.value).toBe(testBackLinkDetails);
            }));
        });
    });

    it('should clear subscriptions on destory', () => {
        const sub = jasmine.createSpyObj<Subscription>('Subscription', ['add', 'unsubscribe']);
        component.subscriptions = sub;
        component.ngOnDestroy();
        expect(component.subscriptions.unsubscribe).toHaveBeenCalled();
    });

    it('should skip to content', () => {
        spyOn(dummyElement, 'focus');
        component.skipToContent();
        expect(dummyElement.focus).toHaveBeenCalled();
    });

    describe('navigateBack', () => {
        it('should call location back when called with falsy value', () => {
            component.navigateBack(null);
            expect(locationSpy.back).toHaveBeenCalledTimes(1);
        });

        it('should call location back when called with falsy value', () => {
            const testPath = 'testPath';
            component.navigateBack(testPath);
            expect(routerSpy.navigate).toHaveBeenCalledWith([testPath]);
        });
    });

    describe('backNavigationComponent', () => {
        const element = 'app-back-navigation';

        it('should not have component when value is null', () => {
            component.backLinkDetails$.next(null);
            fixture.detectChanges();
            expect(fixture.debugElement.query(By.css(element))).toBeFalsy();
        });

        describe('when has value', () => {
            const testLinkText = 'testLinkText';
            const testLinkPath = 'testLinkPath';
            const testBackLinkDetails = new BackLinkDetails(testLinkText, testLinkPath);
            let backNavigationComponent: BackNavigationComponent;
            beforeEach(() => {
                component.backLinkDetails$.next(testBackLinkDetails);
                fixture.detectChanges();
                backNavigationComponent = ngMocks.find<BackNavigationComponent>('app-back-navigation').componentInstance;
            });
            it('sends the correct value to the child input', () => {
                expect(backNavigationComponent.linkText).toEqual(testBackLinkDetails.text);
            });

            it('navigateBack output should call function correctly', () => {
                spyOn(component, 'navigateBack');
                backNavigationComponent.navigateBack.emit();
                expect(component.navigateBack).toHaveBeenCalledWith(testBackLinkDetails.path);
            });
        });
    });
});
