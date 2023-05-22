import { Router } from '@angular/router';
import { Subject, of } from 'rxjs';
import { ProfileService } from '../services/api/profile.service';
import { Role, UserProfileResponse } from '../services/clients/api-client';
import { getSpiedPropertyGetter } from '../shared/jasmine-helpers/property-helpers';
import { MockLogger } from '../testing/mocks/mock-logger';
import { SecurityServiceProvider } from './authentication/security-provider.service';
import { ISecurityService } from './authentication/security-service.interface';
import { JudgeGuard } from './judge.guard';
import { FEATURE_FLAGS, LaunchDarklyService } from '../services/launch-darkly.service';

describe('JudgeGuard', () => {
    let profileServiceSpy: jasmine.SpyObj<ProfileService>;
    let guard: JudgeGuard;
    let router: jasmine.SpyObj<Router>;
    let securityServiceProviderServiceSpy: jasmine.SpyObj<SecurityServiceProvider>;
    let launchDarklyServiceSpy: jasmine.SpyObj<LaunchDarklyService>;
    let securityServiceSpy: jasmine.SpyObj<ISecurityService>;

    beforeAll(() => {
        securityServiceSpy = jasmine.createSpyObj<ISecurityService>('ISecurityService', [], ['isAuthenticated$']);
        router = jasmine.createSpyObj<Router>('Router', ['navigate']);
        profileServiceSpy = jasmine.createSpyObj<ProfileService>('ProfileService', ['getUserProfile']);
        launchDarklyServiceSpy = jasmine.createSpyObj<LaunchDarklyService>('LaunchDarklyService', ['getFlag']);
        securityServiceProviderServiceSpy = jasmine.createSpyObj<SecurityServiceProvider>(
            'SecurityServiceProviderService',
            [],
            ['currentSecurityService$']
        );
        getSpiedPropertyGetter(securityServiceProviderServiceSpy, 'currentSecurityService$').and.returnValue(of(securityServiceSpy));

        profileServiceSpy = jasmine.createSpyObj<ProfileService>('ProfileService', ['getUserProfile']);
    });

    beforeEach(() => {
        launchDarklyServiceSpy.getFlag.withArgs(FEATURE_FLAGS.multiIdpSelection).and.returnValue(of(true));
        guard = new JudgeGuard(securityServiceProviderServiceSpy, profileServiceSpy, router, new MockLogger(), launchDarklyServiceSpy);
    });

    it('should not be able to activate component if role is not Judge', async () => {
        const profile = new UserProfileResponse({ role: Role.VideoHearingsOfficer });
        profileServiceSpy.getUserProfile.and.returnValue(Promise.resolve(profile));
        spyOn(guard, 'isUserAuthorized').and.returnValue(of(true));
        const result = await guard.canActivate(null, null);
        expect(result).toBeFalsy();
        expect(router.navigate).toHaveBeenCalledWith(['/home']);
    });

    it('should be able to activate component if role is Judge', async () => {
        const profile = new UserProfileResponse({ role: Role.Judge });
        profileServiceSpy.getUserProfile.and.returnValue(Promise.resolve(profile));
        spyOn(guard, 'isUserAuthorized').and.returnValue(of(true));
        const result = await guard.canActivate(null, null);
        expect(result).toBeTruthy();
    });

    it('should be able to activate component if role is JudicialOfficeHolder', async () => {
        const profile = new UserProfileResponse({ role: Role.JudicialOfficeHolder });
        profileServiceSpy.getUserProfile.and.returnValue(Promise.resolve(profile));
        spyOn(guard, 'isUserAuthorized').and.returnValue(of(true));
        const result = await guard.canActivate(null, null);
        expect(result).toBeTruthy();
    });

    it('should logout when user profile cannot be retrieved', async () => {
        profileServiceSpy.getUserProfile.and.callFake(() => Promise.reject({ status: 404, isApiException: true }));
        spyOn(guard, 'isUserAuthorized').and.returnValue(of(true));
        const result = await guard.canActivate(null, null);
        expect(result).toBeFalsy();
        expect(router.navigate).toHaveBeenCalledWith(['/logout']);
    });

    it('should back to login when user profile is not authoried', async () => {
        spyOn(guard, 'isUserAuthorized').and.returnValue(of(false));

        const result = await guard.canActivate(null, null);
        expect(result).toBeFalsy();
        expect(router.navigate).toHaveBeenCalledWith(['/login']);
    });
});
