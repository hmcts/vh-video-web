import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { ProfileService } from 'src/app/services/api/profile.service';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { Role, UserProfileResponse } from 'src/app/services/clients/api-client';
import { ErrorService } from 'src/app/services/error.service';
import { Logger } from 'src/app/services/logging/logger-base';
import { UserMediaStreamService } from 'src/app/services/user-media-stream.service';
import { pageUrls } from 'src/app/shared/page-url.constants';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { MockLogger } from 'src/app/testing/mocks/mock-logger';
import { SwitchOnCameraMicrophoneComponent } from './switch-on-camera-microphone.component';
import { fakeAsync, flush, flushMicrotasks } from '@angular/core/testing';
import { ParticipantStatusUpdateService } from 'src/app/services/participant-status-update.service';
import { Subject, throwError } from 'rxjs';
import { mockCamStream } from 'src/app/waiting-space/waiting-room-shared/tests/waiting-room-base-setup';
import { getSpiedPropertyGetter } from 'src/app/shared/jasmine-helpers/property-helpers';
import { UserMediaService } from 'src/app/services/user-media.service';

describe('SwitchOnCameraMicrophoneComponent', () => {
    let component: SwitchOnCameraMicrophoneComponent;

    const conference = new ConferenceTestData().getConferenceDetailFuture();
    const profile = new UserProfileResponse({ role: Role.Judge });
    let currentStreamSubject: Subject<MediaStream>;
    let router: jasmine.SpyObj<Router>;
    let profileService: jasmine.SpyObj<ProfileService>;
    let activatedRoute: ActivatedRoute = <any>{ snapshot: { paramMap: convertToParamMap({ conferenceId: conference.id }) } };
    let videoWebService: jasmine.SpyObj<VideoWebService>;
    let userMediaStreamService: jasmine.SpyObj<UserMediaStreamService>;
    let errorService: jasmine.SpyObj<ErrorService>;
    let userMediaServiceSpy: jasmine.SpyObj<UserMediaService>;
    const logger: Logger = new MockLogger();
    let participantStatusUpdateService: jasmine.SpyObj<ParticipantStatusUpdateService>;

    beforeEach(async () => {
        userMediaStreamService = jasmine.createSpyObj<UserMediaStreamService>('UserMediaStreamService', [], ['currentStream$']);
        currentStreamSubject = new Subject<MediaStream>();

        videoWebService = jasmine.createSpyObj<VideoWebService>('VideoWebService', [
            'getConferencesForIndividual',
            'setActiveIndividualConference',
            'raiseMediaEvent',
            'getObfuscatedName'
        ]);
        videoWebService.getObfuscatedName.and.returnValue('test username');

        errorService = jasmine.createSpyObj<ErrorService>('ErrorService', [
            'goToServiceError',
            'handleApiError',
            'returnHomeIfUnauthorised'
        ]);

        profileService = jasmine.createSpyObj<ProfileService>('ProfileService', ['getUserProfile']);
        profileService.getUserProfile.and.returnValue(Promise.resolve(profile));

        router = jasmine.createSpyObj<Router>('Router', ['navigate']);

        participantStatusUpdateService = jasmine.createSpyObj('ParticipantStatusUpdateService', ['postParticipantStatus']);

        userMediaServiceSpy = jasmine.createSpyObj<UserMediaService>(['initialise']);

        component = new SwitchOnCameraMicrophoneComponent(
            router,
            activatedRoute,
            videoWebService,
            profileService,
            errorService,
            logger,
            participantStatusUpdateService,
            userMediaServiceSpy,
            userMediaStreamService
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
            profileService,
            errorService,
            logger,
            participantStatusUpdateService,
            userMediaServiceSpy,
            userMediaStreamService
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

    it('should log error when raising event fails', async () => {
        const error = new Error('unit test error');
        videoWebService.raiseMediaEvent.and.callFake(() => Promise.reject(error));
        const logSpy = spyOn(logger, 'error');

        await component.postPermissionDeniedAlert();

        expect(logSpy.calls.mostRecent().args[0]).toMatch('Failed to post media permission denied alert');
        expect(logSpy.calls.mostRecent().args[1]).toBe(error);
    });

    it('should update mediaAccepted and userPrompted to true when request media', fakeAsync(() => {
        getSpiedPropertyGetter(userMediaStreamService, 'currentStream$').and.returnValue(currentStreamSubject.asObservable());

        component.requestMedia();
        currentStreamSubject.next(mockCamStream);
        flush();
        expect(component.userPrompted).toBeTrue();
        expect(component.mediaAccepted).toBeTrue();
        expect(userMediaServiceSpy.initialise).toHaveBeenCalledTimes(1);
    }));

    it('should update mediaAccepted and userPrompted to false when request media throw an error', fakeAsync(() => {
        getSpiedPropertyGetter(userMediaStreamService, 'currentStream$').and.callFake(() => {
            return throwError(new Error('Fake error'));
        });
        spyOn(component, 'postPermissionDeniedAlert');

        component.requestMedia();
        flush();
        expect(component.userPrompted).toBeFalse();
        expect(component.mediaAccepted).toBeFalse();
        expect(component.postPermissionDeniedAlert).toHaveBeenCalledTimes(1);
        expect(errorService.goToServiceError).toHaveBeenCalledTimes(1);
    }));
});
