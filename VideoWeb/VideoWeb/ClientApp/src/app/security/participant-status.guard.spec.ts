import { async } from '@angular/core/testing';
import { Router, convertToParamMap } from '@angular/router';
import { ProfileService } from '../services/api/profile.service';
import { Role, UserProfileResponse } from '../services/clients/api-client';
import { MockLogger } from '../testing/mocks/MockLogger';
import { ParticipantStatusGuard } from './participant-status.guard';
import { ParticipantStatusUpdateService } from '../services/participant-status-update.service';

describe('ParticipantStatusGuard', () => {
    let profileServiceSpy: jasmine.SpyObj<ProfileService>;
    let guard: ParticipantStatusGuard;
    let router: jasmine.SpyObj<Router>;
    let participantStatusUpdateService: jasmine.SpyObj<ParticipantStatusUpdateService>;
    let activateRoute: any = { paramMap: convertToParamMap({ conferenceId: 'cef3051f-6909-40b9-a846-100cf4040a9a' }) };

    beforeAll(() => {
        router = jasmine.createSpyObj<Router>('Router', [], { navigated: false });
        profileServiceSpy = jasmine.createSpyObj<ProfileService>('ProfileService', ['getUserProfile']);
        participantStatusUpdateService = jasmine.createSpyObj<ParticipantStatusUpdateService>('ParticipantStatusUpdateService', [
            'postParticipantStatus'
        ]);
    });

    beforeEach(() => {
        guard = new ParticipantStatusGuard(profileServiceSpy, router, new MockLogger(), participantStatusUpdateService);
    });

    it('should on refresh update status to joining', async(async () => {
        const profile = new UserProfileResponse({ role: Role.Individual });
        profileServiceSpy.getUserProfile.and.returnValue(Promise.resolve(profile));
        participantStatusUpdateService.postParticipantStatus.and.returnValue(Promise.resolve());
        const result = await guard.canActivate(activateRoute, null);

        expect(result).toBeTruthy();
        expect(participantStatusUpdateService.postParticipantStatus).toHaveBeenCalled();
    }));
});
