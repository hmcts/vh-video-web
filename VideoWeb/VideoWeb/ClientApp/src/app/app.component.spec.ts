import { HttpClientModule } from '@angular/common/http';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { AdalService } from 'adal-angular4';
import { configureTestSuite } from 'ng-bullet';
import { AppComponent } from './app.component';
import { ConfigService } from './services/api/config.service';
import { ClientSettingsResponse, UserProfileResponse, Role } from './services/clients/api-client';
import { DeviceTypeService } from './services/device-type.service';
import { Logger } from './services/logging/logger-base';
import { PageUrls } from './shared/page-url.constants';
import { MockLogger } from './testing/mocks/MockLogger';
import { FooterStubComponent } from './testing/stubs/footer-stub';
import { HeaderStubComponent } from './testing/stubs/header-stub';
import { ProfileService } from './services/api/profile.service';
import { BetaBannerStubComponent } from './testing/stubs/beta-banner-stub';
import { LocationService } from './services/location.service';
import { ErrorService } from './services/error.service';

describe('AppComponent', () => {
    let configServiceSpy: jasmine.SpyObj<ConfigService>;
    let adalServiceSpy: jasmine.SpyObj<AdalService>;
    let deviceTypeServiceSpy: jasmine.SpyObj<DeviceTypeService>;
    let profileServiceSpy: jasmine.SpyObj<ProfileService>;
    let locationServiceSpy: jasmine.SpyObj<LocationService>;

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

        adalServiceSpy = jasmine.createSpyObj<AdalService>('AdalService', ['init', 'handleWindowCallback', 'userInfo', 'logOut']);

        deviceTypeServiceSpy = jasmine.createSpyObj<DeviceTypeService>(['isSupportedBrowser']);

        profileServiceSpy = jasmine.createSpyObj<ProfileService>('ProfileService', ['getUserProfile']);
        const profile = new UserProfileResponse({ role: Role.Representative });
        profileServiceSpy.getUserProfile.and.returnValue(Promise.resolve(profile));

        locationServiceSpy = jasmine.createSpyObj<LocationService>('LocationService', ['getCurrentUrl', 'getCurrentPathName']);

        TestBed.configureTestingModule({
            imports: [HttpClientModule, RouterTestingModule],
            declarations: [AppComponent, HeaderStubComponent, FooterStubComponent, BetaBannerStubComponent],
            providers: [
                { provide: AdalService, useValue: adalServiceSpy },
                { provide: ConfigService, useValue: configServiceSpy },
                { provide: Logger, useClass: MockLogger },
                { provide: DeviceTypeService, useValue: deviceTypeServiceSpy },
                { provide: DeviceTypeService, useValue: deviceTypeServiceSpy },
                { provide: ProfileService, useValue: profileServiceSpy },
                { provide: LocationService, useValue: locationServiceSpy }
            ]
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

    it('should have a tag Skip to main content', async(() => {
        const compiled = fixture.debugElement.nativeElement;
        expect(compiled.querySelector('a').textContent).toContain('Skip to main content');
    }));

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
        const errorService: ErrorService = TestBed.get(ErrorService);
        spyOn(errorService, 'goToUnauthorised');
        const error = { status: 401, isApiException: true };
        profileServiceSpy.getUserProfile.and.returnValue(Promise.reject(error));
        await component.retrieveProfileRole();
        expect(errorService.goToUnauthorised).toHaveBeenCalled();
    });
});
