import { Router, convertToParamMap } from '@angular/router';
import { ProfileService } from '../services/api/profile.service';
import { Role, UserProfileResponse } from '../services/clients/api-client';
import { MockLogger } from '../testing/mocks/mock-logger';
import { ParticipantStatusGuard } from './participant-status.guard';
import { ParticipantStatusUpdateService } from '../services/participant-status-update.service';
import { ErrorService } from '../services/error.service';

const testCases = [
    { roles: [Role.None], shouldFireJoiningEvent: false },
    { roles: [Role.CaseAdmin], shouldFireJoiningEvent: false },
    { roles: [Role.VideoHearingsOfficer], shouldFireJoiningEvent: false },
    { roles: [Role.HearingFacilitationSupport], shouldFireJoiningEvent: false },
    { roles: [Role.Judge], shouldFireJoiningEvent: false },
    { roles: [Role.Individual], shouldFireJoiningEvent: true },
    { roles: [Role.Representative], shouldFireJoiningEvent: true },
    { roles: [Role.JudicialOfficeHolder], shouldFireJoiningEvent: true },
    { roles: [Role.QuickLinkParticipant], shouldFireJoiningEvent: true },
    { roles: [Role.QuickLinkObserver], shouldFireJoiningEvent: true },
    { roles: [Role.StaffMember], shouldFireJoiningEvent: false },
    { roles: [Role.Administrator], shouldFireJoiningEvent: false }
];

describe('ParticipantStatusGuard', () => {
    let profileServiceSpy: jasmine.SpyObj<ProfileService>;
    let guard: ParticipantStatusGuard;
    let router: jasmine.SpyObj<Router>;
    let participantStatusUpdateService: jasmine.SpyObj<ParticipantStatusUpdateService>;
    let errorService: jasmine.SpyObj<ErrorService>;
    const activateRoute: any = { paramMap: convertToParamMap({ conferenceId: 'cef3051f-6909-40b9-a846-100cf4040a9a' }) };
    beforeAll(() => {
        router = jasmine.createSpyObj<Router>('Router', [], {
            navigated: false,
            url: '/camera-working/cef3051f-6909-40b9-a846-100cf4040a9a'
        });
        profileServiceSpy = jasmine.createSpyObj<ProfileService>('ProfileService', ['getUserProfile']);
        participantStatusUpdateService = jasmine.createSpyObj<ParticipantStatusUpdateService>('ParticipantStatusUpdateService', [
            'postParticipantStatus'
        ]);

        errorService = jasmine.createSpyObj<ErrorService>('ErrorService', ['handleApiError']);
    });

    beforeEach(() => {
        guard = new ParticipantStatusGuard(profileServiceSpy, router, new MockLogger(), errorService, participantStatusUpdateService);
        participantStatusUpdateService.postParticipantStatus.calls.reset();
    });

    it('should cover all the user roles in this test', async () => {
        expect(testCases.length).toBe(Object.keys(Role).length);
    });

    testCases.forEach(testCase => {
        let shouldOrShouldNotUpdate = 'should NOT update';
        if (testCase.shouldFireJoiningEvent) {
            shouldOrShouldNotUpdate = 'should update';
        }
        it(`${shouldOrShouldNotUpdate} status when user with ${testCase.roles} role navigates from /camera-working to /introduction`, async () => {
            const profile = new UserProfileResponse({ roles: testCase.roles });
            profileServiceSpy.getUserProfile.and.returnValue(Promise.resolve(profile));
            participantStatusUpdateService.postParticipantStatus.and.returnValue(Promise.resolve());

            const result = await guard.canActivate(activateRoute, null);

            expect(result).toBeTruthy();
            const expectedCalls = testCase.shouldFireJoiningEvent ? 1 : 0;
            expect(participantStatusUpdateService.postParticipantStatus).toHaveBeenCalledTimes(expectedCalls);
        });
    });
});
