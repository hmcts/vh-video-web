import { convertToParamMap, Router, ActivatedRoute } from '@angular/router';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { TestCallScoreResponse, TestScore, SelfTestPexipResponse, UserProfileResponse, Role } from 'src/app/services/clients/api-client';
import { ErrorService } from 'src/app/services/error.service';
import { Logger } from 'src/app/services/logging/logger-base';
import { pageUrls } from 'src/app/shared/page-url.constants';
import { SelfTestComponent } from 'src/app/shared/self-test/self-test.component';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { MockLogger } from 'src/app/testing/mocks/mock-logger';
import { JudgeSelfTestComponent } from './judge-self-test.component';
import { fakeAsync, flushMicrotasks } from '@angular/core/testing';
import { ProfileService } from 'src/app/services/api/profile.service';

describe('JudgeSelfTestComponent', () => {
    let component: JudgeSelfTestComponent;
    const conference = new ConferenceTestData().getConferenceDetailNow();
    const profile = new UserProfileResponse({ roles: [Role.Individual] });

    let router: jasmine.SpyObj<Router>;
    const activatedRoute: ActivatedRoute = <any>{ snapshot: { paramMap: convertToParamMap({ conferenceId: conference.id }) } };
    let videoWebService: jasmine.SpyObj<VideoWebService>;
    let profileService: jasmine.SpyObj<ProfileService>;
    let errorService: jasmine.SpyObj<ErrorService>;
    const logger: Logger = new MockLogger();

    const pexipConfig = new SelfTestPexipResponse({
        pexip_self_test_node: 'selftest.automated.test'
    });

    beforeAll(() => {
        videoWebService = jasmine.createSpyObj<VideoWebService>('VideoWebService', ['getConferenceById', 'getPexipConfig']);
        profileService = jasmine.createSpyObj<ProfileService>('ProfileService', ['getUserProfile']);

        profileService.getUserProfile.and.returnValue(Promise.resolve(profile));
        videoWebService.getConferenceById.and.returnValue(Promise.resolve(conference));
        videoWebService.getPexipConfig.and.returnValue(Promise.resolve(pexipConfig));

        router = jasmine.createSpyObj<Router>('Router', ['navigateByUrl']);

        errorService = jasmine.createSpyObj<ErrorService>('ErrorService', [
            'goToServiceError',
            'handleApiError',
            'returnHomeIfUnauthorised'
        ]);
    });

    beforeEach(() => {
        component = new JudgeSelfTestComponent(router, activatedRoute, videoWebService, profileService, errorService, logger);
        component.conference = conference;
        component.conferenceId = conference.id;
        router.navigateByUrl.calls.reset();
    });

    it('should get conference when id is found in params', fakeAsync(() => {
        component.conference = undefined;
        component.conferenceId = undefined;

        component.ngOnInit();
        flushMicrotasks();

        expect(component.conferenceId).toBe(conference.id);
        expect(component.conference).toBe(conference);
        expect(component.testInProgress).toBeFalsy();
    }));

    it('should get conference when id is found in params', fakeAsync(() => {
        component.ngOnInit();
        flushMicrotasks();

        expect(component.isStaffMember).toBeFalse();
    }));

    it('should get pexip config when when id is not found in params', fakeAsync(() => {
        const emptyParamsRoute: ActivatedRoute = <any>{ snapshot: { paramMap: convertToParamMap({}) } };
        component = new JudgeSelfTestComponent(router, emptyParamsRoute, videoWebService, profileService, errorService, logger);

        component.ngOnInit();
        flushMicrotasks();

        expect(component.testInProgress).toBeFalsy();
        expect(component.selfTestPexipConfig).toBe(pexipConfig);
    }));

    it('should navigate to hearing list when equipment works', () => {
        component.equipmentWorksHandler();
        expect(router.navigateByUrl).toHaveBeenCalledWith(pageUrls.JudgeHearingList);
    });

    it('should show equipment fault message when equipment fails', () => {
        component.equipmentFaultyHandler();
        expect(component.showEquipmentFaultMessage).toBeTruthy();
        expect(component.testInProgress).toBeFalsy();
        expect(component.hideSelfTest).toBeTruthy();
    });

    it('should show self test restarting video', () => {
        const selfTestSpy = jasmine.createSpyObj<SelfTestComponent>('SelfTestComponent', ['replayVideo']);
        selfTestSpy.replayVideo.and.callFake(() => {});
        component.selfTestComponent = selfTestSpy;

        component.restartTest();

        expect(component.showEquipmentFaultMessage).toBeFalsy();
        expect(component.testInProgress).toBeFalsy();
        expect(component.hideSelfTest).toBeFalsy();
        expect(selfTestSpy.replayVideo).toHaveBeenCalled();
    });

    it('should set test in progress to true when test begins', () => {
        component.onTestStarted();
        expect(component.testInProgress).toBeTruthy();
    });

    it('should set test in progress to false when test completes', () => {
        const score = new TestCallScoreResponse({
            passed: true,
            score: TestScore.Good
        });
        component.onSelfTestCompleted(score);
        expect(component.testInProgress).toBeFalsy();
    });

    it('should define pexip config on successful api call', async () => {
        await component.getPexipConfig();
        expect(component.selfTestPexipConfig).toBeDefined();
    });

    it('should handle api error when conference retrieval fails', async () => {
        const error = { error: 'unable to get conference' };
        videoWebService.getConferenceById.and.callFake(() => Promise.reject(error));

        await component.getConference();

        expect(errorService.handleApiError).toHaveBeenCalledWith(error);
    });

    it('should handle api error when pexip config retrieval fails', async () => {
        const error = { error: 'unable to get pexip config' };
        videoWebService.getPexipConfig.and.callFake(() => Promise.reject(error));

        await component.getPexipConfig();

        expect(errorService.handleApiError).toHaveBeenCalledWith(error);
    });
});
