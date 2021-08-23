import { Router, convertToParamMap } from '@angular/router';
import { ProfileService } from '../services/api/profile.service';
import { Role, UserProfileResponse } from '../services/clients/api-client';
import { MockLogger } from '../testing/mocks/mock-logger';
import { ParticipantStatusGuard } from './participant-status.guard';
import { ParticipantStatusUpdateService } from '../services/participant-status-update.service';

const testCases = [
    { role: Role.None, shouldFireJoiningEvent: false },
    { role: Role.CaseAdmin, shouldFireJoiningEvent: false },
    { role: Role.VideoHearingsOfficer, shouldFireJoiningEvent: false },
    { role: Role.HearingFacilitationSupport, shouldFireJoiningEvent: false },
    { role: Role.Judge, shouldFireJoiningEvent: false },
    { role: Role.Individual, shouldFireJoiningEvent: true },
    { role: Role.Representative, shouldFireJoiningEvent: true },
    { role: Role.JudicialOfficeHolder, shouldFireJoiningEvent: true },
    { role: Role.QuickLinkParticipant, shouldFireJoiningEvent: true },
    { role: Role.QuickLinkObserver, shouldFireJoiningEvent: true }
];

describe('ParticipantStatusGuard', () => {
    let profileServiceSpy: jasmine.SpyObj<ProfileService>;
    let guard: ParticipantStatusGuard;
    let router: jasmine.SpyObj<Router>;
    let participantStatusUpdateService: jasmine.SpyObj<ParticipantStatusUpdateService>;
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
    });

    beforeEach(() => {
        guard = new ParticipantStatusGuard(profileServiceSpy, router, new MockLogger(), participantStatusUpdateService);
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
        it(`${shouldOrShouldNotUpdate} status when user with ${testCase.role} role navigates from /camera-working to /introduction`, async () => {
            const profile = new UserProfileResponse({ role: testCase.role });
            profileServiceSpy.getUserProfile.and.returnValue(Promise.resolve(profile));
            participantStatusUpdateService.postParticipantStatus.and.returnValue(Promise.resolve());

            const result = await guard.canActivate(activateRoute, null);

            expect(result).toBeTruthy();
            const expectedCalls = testCase.shouldFireJoiningEvent ? 1 : 0;
            expect(participantStatusUpdateService.postParticipantStatus).toHaveBeenCalledTimes(expectedCalls);
        });
    });
});

describe('ParticipantStatusGuard', () => {
    let profileServiceSpy: jasmine.SpyObj<ProfileService>;
    let guard: ParticipantStatusGuard;
    let router: jasmine.SpyObj<Router>;
    let participantStatusUpdateService: jasmine.SpyObj<ParticipantStatusUpdateService>;
    const activateRoute: any = { paramMap: convertToParamMap({ conferenceId: 'cef3051f-6909-40b9-a846-100cf4040a9a' }) };
    beforeAll(() => {
        router = jasmine.createSpyObj<Router>('Router', [], {
            navigated: false,
            url: '/hearing-list/cef3051f-6909-40b9-a846-100cf4040a9a'
        });
        profileServiceSpy = jasmine.createSpyObj<ProfileService>('ProfileService', ['getUserProfile']);
        participantStatusUpdateService = jasmine.createSpyObj<ParticipantStatusUpdateService>('ParticipantStatusUpdateService', [
            'postParticipantStatus'
        ]);
    });

    beforeEach(() => {
        guard = new ParticipantStatusGuard(profileServiceSpy, router, new MockLogger(), participantStatusUpdateService);
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
        it(`${shouldOrShouldNotUpdate} status when user with ${testCase.role} role navigates from /hearing-list to /introduction`, async () => {
            const profile = new UserProfileResponse({ role: testCase.role });
            profileServiceSpy.getUserProfile.and.returnValue(Promise.resolve(profile));
            participantStatusUpdateService.postParticipantStatus.and.returnValue(Promise.resolve());

            const result = await guard.canActivate(activateRoute, null);

            expect(result).toBeTruthy();
            const expectedCalls = testCase.shouldFireJoiningEvent ? 1 : 0;
            expect(participantStatusUpdateService.postParticipantStatus).toHaveBeenCalledTimes(expectedCalls);
        });
    });
});
