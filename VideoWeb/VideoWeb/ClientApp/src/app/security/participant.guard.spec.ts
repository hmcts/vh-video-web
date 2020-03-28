import { TestBed, async } from '@angular/core/testing';

import { ParticipantGuard } from './participant.guard';
import { RouterTestingModule } from '@angular/router/testing';
import { SharedModule } from '../shared/shared.module';
import { ProfileService } from '../services/api/profile.service';
import { Router } from '@angular/router';
import { UserProfileResponse, Role } from '../services/clients/api-client';
import { MockLogger } from '../testing/mocks/MockLogger';
import { Logger } from '../services/logging/logger-base';

describe('ParticipantGuard', () => {
    let profileServiceSpy: jasmine.SpyObj<ProfileService>;
    let guard: ParticipantGuard;
    const router = {
        navigate: jasmine.createSpy('navigate')
    };

    beforeEach(() => {
        profileServiceSpy = jasmine.createSpyObj<ProfileService>('ProfileService', ['getUserProfile']);
        TestBed.configureTestingModule({
            imports: [RouterTestingModule, SharedModule],
            providers: [
                ParticipantGuard,
                { provide: Router, useValue: router },
                { provide: ProfileService, useValue: profileServiceSpy },
                { provide: Logger, useClass: MockLogger }
            ]
        });
        guard = TestBed.get(ParticipantGuard);
    });

    it('should not be able to activate component if role is VHOfficer', async(async () => {
        const profile = new UserProfileResponse({ role: Role.VideoHearingsOfficer });
        profileServiceSpy.getUserProfile.and.returnValue(profile);
        const result = await guard.canActivate(null, null);
        expect(result).toBeFalsy();
        expect(router.navigate).toHaveBeenCalledWith(['/home']);
    }));

    it('should not be able to activate component if role is Judge', async(async () => {
        const profile = new UserProfileResponse({ role: Role.Judge });
        profileServiceSpy.getUserProfile.and.returnValue(profile);
        const result = await guard.canActivate(null, null);
        expect(result).toBeFalsy();
        expect(router.navigate).toHaveBeenCalledWith(['/home']);
    }));

    it('should not be able to activate component if role is Case Admin', async(async () => {
        const profile = new UserProfileResponse({ role: Role.CaseAdmin });
        profileServiceSpy.getUserProfile.and.returnValue(profile);
        const result = await guard.canActivate(null, null);
        expect(result).toBeFalsy();
        expect(router.navigate).toHaveBeenCalledWith(['/home']);
    }));

    it('should be able to activate component if role is Individual', async(async () => {
        const profile = new UserProfileResponse({ role: Role.Individual });
        profileServiceSpy.getUserProfile.and.returnValue(profile);
        const result = await guard.canActivate(null, null);
        expect(result).toBeTruthy();
    }));

    it('should be able to activate component if role is Representative', async(async () => {
        const profile = new UserProfileResponse({ role: Role.Representative });
        profileServiceSpy.getUserProfile.and.returnValue(profile);
        const result = await guard.canActivate(null, null);
        expect(result).toBeTruthy();
    }));

    it('should logout when user profile cannot be retrieved', async(async () => {
        profileServiceSpy.getUserProfile.and.callFake(() => Promise.reject({ status: 404, isApiException: true }));
        const result = await guard.canActivate(null, null);
        expect(result).toBeFalsy();
        expect(router.navigate).toHaveBeenCalledWith(['/logout']);
    }));
});
