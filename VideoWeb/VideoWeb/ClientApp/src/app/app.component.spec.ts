import { TestBed } from '@angular/core/testing';
import { Title } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { AdalService } from 'adal-angular4';
import { AppComponent } from './app.component';
import { ConfigService } from './services/api/config.service';
import { ProfileService } from './services/api/profile.service';
import { ClientSettingsResponse, Role, UserProfileResponse } from './services/clients/api-client';
import { DeviceTypeService } from './services/device-type.service';
import { ErrorService } from './services/error.service';
import { LocationService } from './services/location.service';
import { PageUrls } from './shared/page-url.constants';
import { PageTrackerService } from './services/page-tracker.service';
import { MockAdalService } from './testing/mocks/MockAdalService';

describe('AppComponent', () => {
    let configServiceSpy: jasmine.SpyObj<ConfigService>;
    let deviceTypeServiceSpy: jasmine.SpyObj<DeviceTypeService>;
    let profileServiceSpy: jasmine.SpyObj<ProfileService>;
    let locationServiceSpy: jasmine.SpyObj<LocationService>;
    let routerSpy: jasmine.SpyObj<Router>;
    let errorServiceSpy: jasmine.SpyObj<ErrorService>;
    let titleServiceSpy: jasmine.SpyObj<Title>;
    let pageTrackerServiceSpy: jasmine.SpyObj<PageTrackerService>;
    const mockAdalService = new MockAdalService();
    let adalService;

    const clientSettings = new ClientSettingsResponse({
        tenant_id: 'tenantid',
        client_id: 'clientid',
        post_logout_redirect_uri: '/logout',
        redirect_uri: '/home',
        video_api_url: 'http://vh-video-api/'
    });

    let component: AppComponent;

    beforeAll(() => {
        configServiceSpy = jasmine.createSpyObj<ConfigService>('ConfigService', ['clientSettings', 'getClientSettings', 'loadConfig']);
        configServiceSpy.getClientSettings.and.returnValue(clientSettings);
        adalService = mockAdalService;
        deviceTypeServiceSpy = jasmine.createSpyObj<DeviceTypeService>(['isSupportedBrowser']);

        profileServiceSpy = jasmine.createSpyObj<ProfileService>('ProfileService', ['getUserProfile']);
        const profile = new UserProfileResponse({ role: Role.Representative });
        profileServiceSpy.getUserProfile.and.returnValue(Promise.resolve(profile));

        locationServiceSpy = jasmine.createSpyObj<LocationService>('LocationService', ['getCurrentUrl', 'getCurrentPathName']);

        routerSpy = jasmine.createSpyObj<Router>('Router', ['navigate', 'navigateByUrl']);
        errorServiceSpy = jasmine.createSpyObj<ErrorService>('ErrorService', ['handleApiError', 'goToUnauthorised']);
        titleServiceSpy = jasmine.createSpyObj<Title>('Title', ['getTitle', 'setTitle']);

        pageTrackerServiceSpy = jasmine.createSpyObj('PageTrackerService', ['trackNavigation', 'trackPreviousPage']);
    });

    beforeEach(() => {
        component = new AppComponent(
            adalService,
            configServiceSpy,
            routerSpy,
            deviceTypeServiceSpy,
            profileServiceSpy,
            errorServiceSpy,
            titleServiceSpy,
            null,
            locationServiceSpy,
            pageTrackerServiceSpy
        );
        deviceTypeServiceSpy.isSupportedBrowser.and.returnValue(true);
        routerSpy.navigate.and.returnValue(true);
        routerSpy.navigateByUrl.and.returnValue(true);
        routerSpy.navigate.calls.reset();
        routerSpy.navigateByUrl.calls.reset();
        profileServiceSpy.getUserProfile.calls.reset();
    });

    it('should prompt user to login if not authenticated', () => {
        component.ngOnInit();
        expect(routerSpy.navigate).toHaveBeenCalled();
    });

    it('should navigate to unsupported browser page if browser is not compatible', () => {
        deviceTypeServiceSpy.isSupportedBrowser.and.returnValue(false);
        component.checkBrowser();
        expect(routerSpy.navigateByUrl).toHaveBeenCalledWith(PageUrls.UnsupportedBrowser);
    });

    it('should allow user to continue on a supported browser', () => {
        deviceTypeServiceSpy.isSupportedBrowser.and.returnValue(true);
        component.checkBrowser();
        expect(routerSpy.navigateByUrl).toHaveBeenCalledTimes(0);
    });

    it('should log out of adal', () => {
        spyOn(adalService, 'logOut');
        component.logOut();
        expect(component.loggedIn).toBeFalsy();
        expect(adalService.logOut).toHaveBeenCalled();
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
        locationServiceSpy.getCurrentUrl.and.returnValue(PageUrls.AdminVenueList);
        locationServiceSpy.getCurrentPathName.and.returnValue(`/${PageUrls.AdminVenueList}`);
        mockAdalService.setAuthenticated(true);
        await component.checkAuth();
        expect(profileServiceSpy.getUserProfile).toHaveBeenCalled();
    });

    it('should navigate to login not on logout and not authenticated', async () => {
        locationServiceSpy.getCurrentUrl.and.returnValue(PageUrls.AdminVenueList);
        locationServiceSpy.getCurrentPathName.and.returnValue(`/${PageUrls.AdminVenueList}`);
        mockAdalService.setAuthenticated(false);
        await component.checkAuth();
        expect(profileServiceSpy.getUserProfile).toHaveBeenCalledTimes(0);
        expect(routerSpy.navigate).toHaveBeenCalledWith(['/login'], { queryParams: { returnUrl: PageUrls.AdminVenueList } });
    });

    it('should not check auth or get profile on logout', async () => {
        locationServiceSpy.getCurrentUrl.and.returnValue(PageUrls.Logout);
        locationServiceSpy.getCurrentPathName.and.returnValue(`/${PageUrls.Logout}`);
        mockAdalService.setAuthenticated(true);
        await component.checkAuth();
        expect(routerSpy.navigate).toHaveBeenCalledTimes(0);
        expect(profileServiceSpy.getUserProfile).toHaveBeenCalledTimes(0);
    });
});
