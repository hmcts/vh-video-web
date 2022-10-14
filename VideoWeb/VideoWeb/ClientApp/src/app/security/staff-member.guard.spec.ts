import { Router } from '@angular/router';
import { ProfileService } from '../services/api/profile.service';
import { Role, UserProfileResponse } from '../services/clients/api-client';
import { MockLogger } from '../testing/mocks/mock-logger';
import { StaffMemberGuard } from './staff-member.guard';
import { of } from 'rxjs';
import { FeatureFlagService } from '../services/feature-flag.service';
import { SecurityServiceProvider } from './authentication/security-provider.service';
import { ISecurityService } from './authentication/security-service.interface';
import { getSpiedPropertyGetter } from '../shared/jasmine-helpers/property-helpers';
import { pageUrls } from '../shared/page-url.constants';

describe('StaffMemberGuard', () => {
    let profileServiceSpy: jasmine.SpyObj<ProfileService>;
    let guard: StaffMemberGuard;
    let router: jasmine.SpyObj<Router>;
    let securityServiceProviderServiceSpy: jasmine.SpyObj<SecurityServiceProvider>;
    let featureFlagServiceSpy: jasmine.SpyObj<FeatureFlagService>;
    let securityServiceSpy: jasmine.SpyObj<ISecurityService>;

    beforeAll(() => {
        router = jasmine.createSpyObj<Router>('Router', ['navigate']);
        profileServiceSpy = jasmine.createSpyObj<ProfileService>('ProfileService', ['getUserProfile']);
        featureFlagServiceSpy = jasmine.createSpyObj<FeatureFlagService>('FeatureFlagService', ['getFeatureFlagByName']);
        securityServiceProviderServiceSpy = jasmine.createSpyObj<SecurityServiceProvider>(
            'SecurityServiceProviderService',
            [],
            ['currentSecurityService$']
        );
        securityServiceSpy = jasmine.createSpyObj<ISecurityService>('ISecurityService', [], ['isAuthenticated$']);
        getSpiedPropertyGetter(securityServiceProviderServiceSpy, 'currentSecurityService$').and.returnValue(of(securityServiceSpy));
    });

    beforeEach(() => {
        guard = new StaffMemberGuard(securityServiceProviderServiceSpy, profileServiceSpy, router, new MockLogger(), featureFlagServiceSpy);
    });

    it('should not be able to activate component if role is not StaffMember', async () => {
        const profile = new UserProfileResponse({ role: Role.VideoHearingsOfficer });
        profileServiceSpy.getUserProfile.and.returnValue(Promise.resolve(profile));
        spyOn(guard, 'isUserAuthorized').and.returnValue(of(true));
        const result = await guard.canActivate(null, null);
        expect(result).toBeFalsy();
        expect(router.navigate).toHaveBeenCalledWith([pageUrls.Home]);
    });

    it('should be able to activate component if role is StaffMember', async () => {
        const profile = new UserProfileResponse({ role: Role.StaffMember });
        profileServiceSpy.getUserProfile.and.returnValue(Promise.resolve(profile));
        spyOn(guard, 'isUserAuthorized').and.returnValue(of(true));
        const result = await guard.canActivate(null, null);
        expect(result).toBeTruthy();
    });

    it('should not be able to activate component if authorisation is false', async () => {
        spyOn(guard, 'isUserAuthorized').and.returnValue(of(false));
        const result = await guard.canActivate(null, null);

        expect(result).toBeFalsy();
        expect(router.navigate).toHaveBeenCalledWith([pageUrls.Login]);
    });

    it('should logout when user profile cannot be retrieved', async () => {
        profileServiceSpy.getUserProfile.and.callFake(() => Promise.reject({ status: 404, isApiException: true }));
        spyOn(guard, 'isUserAuthorized').and.returnValue(of(true));
        const result = await guard.canActivate(null, null);
        expect(result).toBeFalsy();
        expect(router.navigate).toHaveBeenCalledWith([pageUrls.Logout]);
    });
});
