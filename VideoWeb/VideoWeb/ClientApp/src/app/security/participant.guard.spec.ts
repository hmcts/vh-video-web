import { async } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { ProfileService } from '../services/api/profile.service';
import { Role, UserProfileResponse } from '../services/clients/api-client';
import { MockLogger } from '../testing/mocks/mock-logger';
import { AuthGuard } from './auth.guard';
import { ParticipantGuard } from './participant.guard';

describe('ParticipantGuard', () => {
    let profileServiceSpy: jasmine.SpyObj<ProfileService>;
    let guard: ParticipantGuard;
    let router: jasmine.SpyObj<Router>;
    let authGuard: jasmine.SpyObj<AuthGuard>;

    beforeAll(() => {
        router = jasmine.createSpyObj<Router>('Router', ['navigate']);
        authGuard = jasmine.createSpyObj<AuthGuard>('AuthGuard', ['canActivate']);
        authGuard.canActivate.and.returnValue(of(true));
        profileServiceSpy = jasmine.createSpyObj<ProfileService>('ProfileService', ['getUserProfile']);
    });

    beforeEach(() => {
        guard = new ParticipantGuard(profileServiceSpy, router, new MockLogger(), authGuard);
    });

    it('should not be able to activate component if role is VHOfficer', async () => {
        const profile = new UserProfileResponse({ role: Role.VideoHearingsOfficer });
        profileServiceSpy.getUserProfile.and.returnValue(Promise.resolve(profile));
        const result = await guard.canActivate(null, null);
        expect(result).toBeFalsy();
        expect(router.navigate).toHaveBeenCalledWith(['/home']);
    });

    it('should not be able to activate component if role is Judge', async () => {
        const profile = new UserProfileResponse({ role: Role.Judge });
        profileServiceSpy.getUserProfile.and.returnValue(Promise.resolve(profile));
        const result = await guard.canActivate(null, null);
        expect(result).toBeFalsy();
        expect(router.navigate).toHaveBeenCalledWith(['/home']);
    });

    it('should not be able to activate component if role is Case Admin', async () => {
        const profile = new UserProfileResponse({ role: Role.CaseAdmin });
        profileServiceSpy.getUserProfile.and.returnValue(Promise.resolve(profile));
        const result = await guard.canActivate(null, null);
        expect(result).toBeFalsy();
        expect(router.navigate).toHaveBeenCalledWith(['/home']);
    });

    it('should be able to activate component if role is Individual', async () => {
        const profile = new UserProfileResponse({ role: Role.Individual });
        profileServiceSpy.getUserProfile.and.returnValue(Promise.resolve(profile));
        const result = await guard.canActivate(null, null);
        expect(result).toBeTruthy();
    });

    it('should be able to activate component if role is Representative', async () => {
        const profile = new UserProfileResponse({ role: Role.Representative });
        profileServiceSpy.getUserProfile.and.returnValue(Promise.resolve(profile));
        const result = await guard.canActivate(null, null);
        expect(result).toBeTruthy();
    });

    it('should be not able to activate component if role is JudicialOfficeHolder', async () => {
        const profile = new UserProfileResponse({ role: Role.JudicialOfficeHolder });
        profileServiceSpy.getUserProfile.and.returnValue(Promise.resolve(profile));
        const result = await guard.canActivate(null, null);
        expect(result).toBeFalsy();
    });

    it('should logout when user profile cannot be retrieved', async () => {
        profileServiceSpy.getUserProfile.and.callFake(() => Promise.reject({ status: 404, isApiException: true }));
        const result = await guard.canActivate(null, null);
        expect(result).toBeFalsy();
        expect(router.navigate).toHaveBeenCalledWith(['/logout']);
    });
    it('should logout when user profile cannot be retrieved', async () => {
        authGuard.canActivate.and.returnValue(of(false));
        const result = await guard.canActivate(null, null);
        expect(result).toBeFalsy();
        expect(router.navigate).toHaveBeenCalledWith(['/login']);
    });
});
