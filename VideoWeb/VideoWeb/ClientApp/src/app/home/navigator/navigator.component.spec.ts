import { Router } from '@angular/router';
import { ProfileService } from '../../services/api/profile.service';
import { ClientSettingsResponse, Role, UserProfileResponse } from '../../services/clients/api-client';
import { DeviceTypeService } from '../../services/device-type.service';
import { ErrorService } from '../../services/error.service';
import { pageUrls } from '../../shared/page-url.constants';
import { NavigatorComponent } from './navigator.component';
import { fakeAsync, flushMicrotasks, tick } from '@angular/core/testing';
import { ConfigService } from 'src/app/services/api/config.service';
import { of } from 'rxjs';

describe('NavigatorComponent', () => {
    let component: NavigatorComponent;
    let router: jasmine.SpyObj<Router>;
    let profileServiceSpy: jasmine.SpyObj<ProfileService>;
    let configServiceSpy: jasmine.SpyObj<ConfigService>;
    let deviceTypeServiceSpy: jasmine.SpyObj<DeviceTypeService>;
    let errorServiceSpy: jasmine.SpyObj<ErrorService>;
    let clientSettingsResponse: ClientSettingsResponse;

    beforeAll(() => {
        clientSettingsResponse = new ClientSettingsResponse({
            enable_android_support: true,
            enable_ios_tablet_support: true,
            enable_ios_mobile_support: true
        });

        router = jasmine.createSpyObj<Router>('Router', ['navigate']);
        profileServiceSpy = jasmine.createSpyObj<ProfileService>('ProfileService', ['getUserProfile']);
        configServiceSpy = jasmine.createSpyObj<ConfigService>('ConfigService', ['getClientSettings']);
        deviceTypeServiceSpy = jasmine.createSpyObj<DeviceTypeService>(['isMobile', 'isTablet', 'isDesktop', 'isIOS', 'isAndroid']);
        errorServiceSpy = jasmine.createSpyObj<ErrorService>('ErrorService', ['handleApiError']);
        configServiceSpy.getClientSettings.and.returnValue(of(clientSettingsResponse));
    });

    beforeEach(() => {
        component = new NavigatorComponent(router, profileServiceSpy, errorServiceSpy, deviceTypeServiceSpy, configServiceSpy);
        router.navigate.and.callFake(() => Promise.resolve(true));
    });

    it('should go to judge hearing list if user is a judge', async () => {
        const profile = new UserProfileResponse({ role: Role.Judge });
        component.navigateToHearingList(profile);
        expect(router.navigate).toHaveBeenCalledWith([pageUrls.JudgeHearingList]);
    });

    it('should go to judge hearing list if user is a JOH', async () => {
        const profile = new UserProfileResponse({ role: Role.JudicialOfficeHolder });
        component.navigateToHearingList(profile);
        expect(router.navigate).toHaveBeenCalledWith([pageUrls.JudgeHearingList]);
    });

    it('should go to admin venue list if user is a vho', () => {
        const profile = new UserProfileResponse({ role: Role.VideoHearingsOfficer });
        component.navigateToHearingList(profile);
        expect(router.navigate).toHaveBeenCalledWith([pageUrls.AdminVenueList]);
    });

    it('should go to participant hearing list if user is a representative', () => {
        const profile = new UserProfileResponse({ role: Role.Representative });
        component.navigateToHearingList(profile);
        expect(router.navigate).toHaveBeenCalledWith([pageUrls.ParticipantHearingList]);
    });

    it('should go to participant hearing list if user is an individual', () => {
        const profile = new UserProfileResponse({ role: Role.Individual });
        component.navigateToHearingList(profile);
        expect(router.navigate).toHaveBeenCalledWith([pageUrls.ParticipantHearingList]);
    });

    it('should go to unauthorised if user is a case admin', () => {
        const profile = new UserProfileResponse({ role: Role.CaseAdmin });
        component.navigateToHearingList(profile);
        expect(router.navigate).toHaveBeenCalledWith([pageUrls.Unauthorised]);
    });

    it('should navigate to hearing list if ios is supported and is on ios mobile device', fakeAsync(() => {
        const profile = new UserProfileResponse({ role: Role.Individual });
        deviceTypeServiceSpy.isDesktop.and.returnValue(false);
        deviceTypeServiceSpy.isIOS.and.returnValue(true);
        clientSettingsResponse.enable_ios_mobile_support = true;
        configServiceSpy.getClientSettings.and.returnValue(of(clientSettingsResponse));
        profileServiceSpy.getUserProfile.and.returnValue(Promise.resolve(profile));
        spyOn(component, 'navigateToHearingList');

        component.ngOnInit();
        tick();

        expect(component.navigateToHearingList).toHaveBeenCalledWith(profile);
    }));
    it('should navigate to hearing list if ios is supported and is on ios tablet device', fakeAsync(() => {
        const profile = new UserProfileResponse({ role: Role.Individual });
        deviceTypeServiceSpy.isDesktop.and.returnValue(false);
        deviceTypeServiceSpy.isIOS.and.returnValue(true);
        clientSettingsResponse.enable_ios_tablet_support = true;
        configServiceSpy.getClientSettings.and.returnValue(of(clientSettingsResponse));
        profileServiceSpy.getUserProfile.and.returnValue(Promise.resolve(profile));
        spyOn(component, 'navigateToHearingList');

        component.ngOnInit();
        tick();

        expect(component.navigateToHearingList).toHaveBeenCalledWith(profile);
    }));

    it('should navigate to unsupported device if ios is not supported and is on ios mobile device', fakeAsync(() => {
        deviceTypeServiceSpy.isDesktop.and.returnValue(false);
        deviceTypeServiceSpy.isIOS.and.returnValue(true);
        clientSettingsResponse.enable_ios_mobile_support = false;

        component.ngOnInit();
        tick();

        expect(router.navigate).toHaveBeenCalledWith([pageUrls.UnsupportedDevice]);
    }));

    it('should navigate to hearing list if android is supported and is on android device', fakeAsync(() => {
        const profile = new UserProfileResponse({ role: Role.Individual });
        deviceTypeServiceSpy.isDesktop.and.returnValue(false);
        deviceTypeServiceSpy.isAndroid.and.returnValue(true);
        clientSettingsResponse.enable_android_support = true;
        configServiceSpy.getClientSettings.and.returnValue(of(clientSettingsResponse));
        profileServiceSpy.getUserProfile.and.returnValue(Promise.resolve(profile));
        spyOn(component, 'navigateToHearingList');

        component.ngOnInit();
        tick();

        expect(component.navigateToHearingList).toHaveBeenCalledWith(profile);
    }));

    it('should navigate to unsupported device if android is not supported and is on android device', fakeAsync(() => {
        deviceTypeServiceSpy.isDesktop.and.returnValue(false);
        deviceTypeServiceSpy.isAndroid.and.returnValue(true);
        clientSettingsResponse.enable_android_support = false;

        component.ngOnInit();
        tick();

        expect(router.navigate).toHaveBeenCalledWith([pageUrls.UnsupportedDevice]);
    }));
    it('should redirect to the unsupported device page when the enable_android_support toggle off for an android mobile', fakeAsync(() => {
        // Arrange
        deviceTypeServiceSpy.isAndroid.and.returnValue(true);
        deviceTypeServiceSpy.isMobile.and.returnValue(true);
        clientSettingsResponse.enable_android_support = false;
        // Act
        component.ngOnInit();
        tick();
        // Assert
        expect(router.navigate).toHaveBeenCalledWith([pageUrls.UnsupportedDevice]);
    }));
    it('should redirect to the unsupported device page when the enable_android_support toggle off for an android tablet', fakeAsync(() => {
        // Arrange
        deviceTypeServiceSpy.isAndroid.and.returnValue(true);
        deviceTypeServiceSpy.isTablet.and.returnValue(true);
        clientSettingsResponse.enable_android_support = false;
        // Act
        component.ngOnInit();
        tick();
        // Assert
        expect(router.navigate).toHaveBeenCalledWith([pageUrls.UnsupportedDevice]);
    }));

    it('should redirect to unsupported device screen if on a mobile device and is not supported', () => {
        deviceTypeServiceSpy.isDesktop.and.returnValue(false);
        clientSettingsResponse.enable_android_support = false;
        clientSettingsResponse.enable_ios_mobile_support = false;

        component.ngOnInit();

        expect(router.navigate).toHaveBeenCalledWith([pageUrls.UnsupportedDevice]);
    });

    it('should navigate to hearing list when device is a desktop', fakeAsync(() => {
        const profile = new UserProfileResponse({ role: Role.Representative });
        profileServiceSpy.getUserProfile.and.callFake(() => Promise.resolve(profile));
        deviceTypeServiceSpy.isDesktop.and.returnValue(true);
        spyOn(component, 'navigateToHearingList');
        component.ngOnInit();
        flushMicrotasks();
        expect(component.navigateToHearingList).toHaveBeenCalledWith(profile);
    }));

    it('should let error service manage API error when get profile fails', fakeAsync(() => {
        const error = { error: 'test error', statusCode: 500 };
        profileServiceSpy.getUserProfile.and.returnValue(Promise.reject(error));
        deviceTypeServiceSpy.isDesktop.and.returnValue(true);
        spyOn(component, 'navigateToHearingList');
        component.ngOnInit();
        flushMicrotasks();
        expect(errorServiceSpy.handleApiError).toHaveBeenCalledWith(error);
    }));
});
