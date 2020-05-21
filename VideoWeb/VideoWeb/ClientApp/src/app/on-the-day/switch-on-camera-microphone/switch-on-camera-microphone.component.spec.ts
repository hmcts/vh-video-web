import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { ProfileService } from 'src/app/services/api/profile.service';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { AddMediaEventRequest, Role, UserProfileResponse } from 'src/app/services/clients/api-client';
import { ErrorService } from 'src/app/services/error.service';
import { Logger } from 'src/app/services/logging/logger-base';
import { UserMediaStreamService } from 'src/app/services/user-media-stream.service';
import { pageUrls } from 'src/app/shared/page-url.constants';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { MockLogger } from 'src/app/testing/mocks/MockLogger';
import { SwitchOnCameraMicrophoneComponent } from './switch-on-camera-microphone.component';
import { fakeAsync, flushMicrotasks } from '@angular/core/testing';

describe('SwitchOnCameraMicrophoneComponent', () => {
    let component: SwitchOnCameraMicrophoneComponent;

    const conference = new ConferenceTestData().getConferenceDetailFuture();
    const profile = new UserProfileResponse({ role: Role.Judge });

    let router: jasmine.SpyObj<Router>;
    let profileService: jasmine.SpyObj<ProfileService>;
    let activatedRoute: ActivatedRoute = <any>{ snapshot: { paramMap: convertToParamMap({ conferenceId: conference.id }) } };
    let videoWebService: jasmine.SpyObj<VideoWebService>;
    let userMediaStreamService: jasmine.SpyObj<UserMediaStreamService>;
    let errorService: jasmine.SpyObj<ErrorService>;
    const logger: Logger = new MockLogger();

    beforeAll(() => {
        videoWebService = jasmine.createSpyObj<VideoWebService>('VideoWebService', [
            'getConferencesForIndividual',
            'setActiveIndividualConference',
            'raiseMediaEvent',
            'getObfuscatedName'
        ]);
        videoWebService.getObfuscatedName.and.returnValue('test username');

        userMediaStreamService = jasmine.createSpyObj<UserMediaStreamService>('UserMediaStreamService', ['requestAccess']);

        errorService = jasmine.createSpyObj<ErrorService>('ErrorService', [
            'goToServiceError',
            'handleApiError',
            'returnHomeIfUnauthorised'
        ]);

        profileService = jasmine.createSpyObj<ProfileService>('ProfileService', ['getUserProfile']);
        profileService.getUserProfile.and.returnValue(Promise.resolve(profile));

        router = jasmine.createSpyObj<Router>('Router', ['navigate']);
    });

    beforeEach(async () => {
        component = new SwitchOnCameraMicrophoneComponent(
            router,
            activatedRoute,
            videoWebService,
            userMediaStreamService,
            profileService,
            errorService,
            logger
        );
        component.conference = conference;
        component.conferenceId = conference.id;

        videoWebService.raiseMediaEvent.calls.reset();
        router.navigate.calls.reset();
    });

    it('should get profile and conference on init', fakeAsync(() => {
        component.ngOnInit();
        flushMicrotasks();

        expect(component.conferenceId).toBe(conference.id);
    }));

    it('should get profile and skip conference when conference id is not in route init', fakeAsync(() => {
        activatedRoute = <any>{ snapshot: { paramMap: convertToParamMap({}) } };
        component = new SwitchOnCameraMicrophoneComponent(
            router,
            activatedRoute,
            videoWebService,
            userMediaStreamService,
            profileService,
            errorService,
            logger
        );

        component.ngOnInit();
        flushMicrotasks();

        expect(component.participantName).toBeDefined();
        expect(component.conferenceId).toBeNull();
    }));

    const profileIsJudgeTestCases = [
        { role: Role.Judge, expected: true },
        { role: Role.CaseAdmin, expected: false },
        { role: Role.HearingFacilitationSupport, expected: false },
        { role: Role.Individual, expected: false },
        { role: Role.Representative, expected: false },
        { role: Role.VideoHearingsOfficer, expected: false }
    ];

    profileIsJudgeTestCases.forEach(test => {
        it(`should set "isJudge" to ${test.expected} when profile role is ${test.role}`, async () => {
            profile.role = test.role;
            profileService.getUserProfile.and.returnValue(Promise.resolve(profile));

            await component.retrieveProfile();

            expect(component.isJudge).toBe(test.expected);
        });
    });

    const goToVideoTestCases = [
        { role: Role.Judge, conferenceId: conference.id, expected: [pageUrls.JudgeSelfTestVideo, conference.id] },
        { role: Role.Judge, conferenceId: null, expected: [pageUrls.IndependentSelfTestVideo] },
        { role: Role.Individual, conferenceId: conference.id, expected: [pageUrls.ParticipantSelfTestVideo, conference.id] },
        { role: Role.Individual, conferenceId: null, expected: [pageUrls.IndependentSelfTestVideo] }
    ];

    goToVideoTestCases.forEach(test => {
        it(`should go to ${test.expected[0]} when profile role is ${test.role} and conference id is ${
            test.conferenceId ? 'set' : 'not set'
        }`, async () => {
            component.isJudge = test.role === Role.Judge;
            component.conferenceId = test.conferenceId;
            component.goVideoTest();
            expect(router.navigate).toHaveBeenCalledWith(test.expected);
        });
    });

    it('should raise permission denied event on media access rejection', async () => {
        userMediaStreamService.requestAccess.and.returnValue(Promise.resolve(false));

        await component.requestMedia();
        expect(component.mediaAccepted).toBeFalsy();
        expect(videoWebService.raiseMediaEvent).toHaveBeenCalledWith(conference.id, new AddMediaEventRequest());
    });

    it('should not raise permission denied event on media access acceptance', async () => {
        userMediaStreamService.requestAccess.and.returnValue(Promise.resolve(true));

        await component.requestMedia();
        expect(component.mediaAccepted).toBeTruthy();
        expect(videoWebService.raiseMediaEvent).toHaveBeenCalledTimes(0);
    });

    it('should log error when raising event fails', async () => {
        const error = new Error('unit test error');
        videoWebService.raiseMediaEvent.and.callFake(() => Promise.reject(error));
        const logSpy = spyOn(logger, 'error');

        await component.postPermissionDeniedAlert();

        expect(logSpy.calls.mostRecent().args[0]).toMatch('Failed to post media permission denied alert');
        expect(logSpy.calls.mostRecent().args[1]).toBe(error);
    });
});
