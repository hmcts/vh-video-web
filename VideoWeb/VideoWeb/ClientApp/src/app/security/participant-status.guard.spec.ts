import { Router, convertToParamMap } from '@angular/router';
import { ProfileService } from '../services/api/profile.service';
import { Role, UserProfileResponse } from '../services/clients/api-client';
import { MockLogger } from '../testing/mocks/mock-logger';
import { ParticipantStatusGuard } from './participant-status.guard';
import { ParticipantStatusUpdateService } from '../services/participant-status-update.service';
import { ErrorService } from '../services/error.service';
import { SecurityServiceProvider } from './authentication/security-provider.service';
import { FeatureFlagService } from '../services/feature-flag.service';
import { of } from 'rxjs';
import { getSpiedPropertyGetter } from '../shared/jasmine-helpers/property-helpers';
import { ISecurityService } from './authentication/security-service.interface';

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
    { role: Role.QuickLinkObserver, shouldFireJoiningEvent: true },
    { role: Role.StaffMember, shouldFireJoiningEvent: false }
];

describe('ParticipantStatusGuard', () => {
    let profileServiceSpy: jasmine.SpyObj<ProfileService>;
    let guard: ParticipantStatusGuard;
    let router: jasmine.SpyObj<Router>;
    let participantStatusUpdateService: jasmine.SpyObj<ParticipantStatusUpdateService>;
    let errorService: jasmine.SpyObj<ErrorService>;
    const activateRoute: any = { paramMap: convertToParamMap({ conferenceId: 'cef3051f-6909-40b9-a846-100cf4040a9a' }) };
    let securityServiceProviderServiceSpy: jasmine.SpyObj<SecurityServiceProvider>;
    let featureFlagServiceSpy: jasmine.SpyObj<FeatureFlagService>;
    let securityServiceSpy: jasmine.SpyObj<ISecurityService>;

    beforeAll(() => {
        router = jasmine.createSpyObj<Router>('Router', ['navigate'], {
            navigated: false,
            url: '/camera-working/cef3051f-6909-40b9-a846-100cf4040a9a'
        });
        profileServiceSpy = jasmine.createSpyObj<ProfileService>('ProfileService', ['getUserProfile']);
        participantStatusUpdateService = jasmine.createSpyObj<ParticipantStatusUpdateService>('ParticipantStatusUpdateService', [
            'postParticipantStatus'
        ]);
        featureFlagServiceSpy = jasmine.createSpyObj<FeatureFlagService>('FeatureFlagService', ['getFeatureFlagByName']);
        securityServiceProviderServiceSpy = jasmine.createSpyObj<SecurityServiceProvider>(
            'SecurityServiceProviderService',
            [],
            ['currentSecurityService$']
        );
        securityServiceSpy = jasmine.createSpyObj<ISecurityService>('ISecurityService', [], ['isAuthenticated$']);
        getSpiedPropertyGetter(securityServiceProviderServiceSpy, 'currentSecurityService$').and.returnValue(of(securityServiceSpy));
        errorService = jasmine.createSpyObj<ErrorService>('ErrorService', ['handleApiError']);
    });

    beforeEach(() => {
        guard = new ParticipantStatusGuard(
            securityServiceProviderServiceSpy,
            profileServiceSpy,
            router,
            new MockLogger(),
            featureFlagServiceSpy,
            errorService,
            participantStatusUpdateService
        );
        participantStatusUpdateService.postParticipantStatus.calls.reset();
    });

    it('should cover all the user roles in this test', async () => {
        expect(testCases.length).toBe(Object.keys(Role).length);
    });

    testCases.forEach(testCase => {
        let shouldOrShouldNotUpdate = 'should NOT update';
        let expectedCalls = 0;
        if (testCase.shouldFireJoiningEvent) {
            shouldOrShouldNotUpdate = 'should update';
            expectedCalls = 1;
        }
        it(`${shouldOrShouldNotUpdate} status when user with ${testCase.role} role navigates from /camera-working to /introduction`, async () => {
            const profile = new UserProfileResponse({ role: testCase.role });
            profileServiceSpy.getUserProfile.and.returnValue(Promise.resolve(profile));
            participantStatusUpdateService.postParticipantStatus.and.returnValue(Promise.resolve());

            spyOn(guard, 'isUserAuthorized').and.returnValue(of(true));

            const result = await guard.canActivate(activateRoute, null);

            testCase.shouldFireJoiningEvent ? expect(result).toBeTruthy() : expect(result).toBeFalsy();
            expect(participantStatusUpdateService.postParticipantStatus).toHaveBeenCalledTimes(expectedCalls);
        });
    });
});
