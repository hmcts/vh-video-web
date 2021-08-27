import { Router } from '@angular/router';
import { ProfileService } from '../services/api/profile.service';
import { Role, UserProfileResponse } from '../services/clients/api-client';
import { MockLogger } from '../testing/mocks/mock-logger';
import { StaffMemberGuard } from './staff-member.guard';

describe('StaffMemberGuard', () => {
    let profileServiceSpy: jasmine.SpyObj<ProfileService>;
    let guard: StaffMemberGuard;
    let router: jasmine.SpyObj<Router>;

    beforeAll(() => {
        router = jasmine.createSpyObj<Router>('Router', ['navigate']);
        profileServiceSpy = jasmine.createSpyObj<ProfileService>('ProfileService', ['getUserProfile']);
    });

    beforeEach(() => {
        guard = new StaffMemberGuard(profileServiceSpy, router, new MockLogger());
    });

    it('should not be able to activate component if role is not StaffMember', async () => {
        const profile = new UserProfileResponse({ role: Role.VideoHearingsOfficer });
        profileServiceSpy.getUserProfile.and.returnValue(Promise.resolve(profile));
        const result = await guard.canActivate(null, null);
        expect(result).toBeFalsy();
        expect(router.navigate).toHaveBeenCalledWith(['/home']);
    });

    it('should be able to activate component if role is StaffMember', async () => {
        const profile = new UserProfileResponse({ role: Role.StaffMember });
        profileServiceSpy.getUserProfile.and.returnValue(Promise.resolve(profile));
        const result = await guard.canActivate(null, null);
        expect(result).toBeTruthy();
    });

    it('should logout when user profile cannot be retrieved', async () => {
        profileServiceSpy.getUserProfile.and.callFake(() => Promise.reject({ status: 404, isApiException: true }));
        const result = await guard.canActivate(null, null);
        expect(result).toBeFalsy();
        expect(router.navigate).toHaveBeenCalledWith(['/logout']);
    });
});
