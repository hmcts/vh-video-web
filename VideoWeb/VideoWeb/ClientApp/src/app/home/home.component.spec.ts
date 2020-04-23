import { Router } from '@angular/router';
import { ProfileService } from '../services/api/profile.service';
import { Role, UserProfileResponse } from '../services/clients/api-client';
import { DeviceTypeService } from '../services/device-type.service';
import { ErrorService } from '../services/error.service';
import { PageUrls } from '../shared/page-url.constants';
import { HomeComponent } from './home.component';
import { fakeAsync, flushMicrotasks } from '@angular/core/testing';

describe('HomeComponent', () => {
    let component: HomeComponent;
    let router: jasmine.SpyObj<Router>;
    let profileServiceSpy: jasmine.SpyObj<ProfileService>;
    let deviceTypeServiceSpy: jasmine.SpyObj<DeviceTypeService>;
    let errorServiceSpy: jasmine.SpyObj<ErrorService>;

    beforeAll(() => {
        router = jasmine.createSpyObj<Router>('Router', ['navigate']);
        profileServiceSpy = jasmine.createSpyObj<ProfileService>('ProfileService', ['getUserProfile']);
        deviceTypeServiceSpy = jasmine.createSpyObj<DeviceTypeService>(['isMobile', 'isTablet', 'isDesktop']);
        errorServiceSpy = jasmine.createSpyObj<ErrorService>('ErrorService', ['handleApiError']);
    });

    beforeEach(() => {
        component = new HomeComponent(router, profileServiceSpy, errorServiceSpy, deviceTypeServiceSpy);
        router.navigate.and.callFake(() => Promise.resolve(true));
    });

    it('should go to judge hearing list if user is a judge', async () => {
        const profile = new UserProfileResponse({ role: Role.Judge });
        component.navigateToHearingList(profile);
        expect(router.navigate).toHaveBeenCalledWith([PageUrls.JudgeHearingList]);
    });

    it('should go to admin venue list if user is a vho', () => {
        const profile = new UserProfileResponse({ role: Role.VideoHearingsOfficer });
        component.navigateToHearingList(profile);
        expect(router.navigate).toHaveBeenCalledWith([PageUrls.AdminVenueList]);
    });

    it('should go to participant hearing list if user is a representative', () => {
        const profile = new UserProfileResponse({ role: Role.Representative });
        component.navigateToHearingList(profile);
        expect(router.navigate).toHaveBeenCalledWith([PageUrls.ParticipantHearingList]);
    });

    it('should go to participant hearing list if user is an individual', () => {
        const profile = new UserProfileResponse({ role: Role.Individual });
        component.navigateToHearingList(profile);
        expect(router.navigate).toHaveBeenCalledWith([PageUrls.ParticipantHearingList]);
    });

    it('should go to unauthorised if user is a case admin', () => {
        const profile = new UserProfileResponse({ role: Role.CaseAdmin });
        component.navigateToHearingList(profile);
        expect(router.navigate).toHaveBeenCalledWith([PageUrls.Unauthorised]);
    });

    it('should redirect to signon-a-computer screen if on a mobile device', () => {
        deviceTypeServiceSpy.isDesktop.and.returnValue(false);
        component.ngOnInit();
        expect(router.navigate).toHaveBeenCalledWith([PageUrls.SignonAComputer]);
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
