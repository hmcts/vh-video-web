import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { SelfTestPexipResponse, TestCallScoreResponse, TestScore } from 'src/app/services/clients/api-client';
import { ErrorService } from 'src/app/services/error.service';
import { Logger } from 'src/app/services/logging/logger-base';
import { pageUrls } from 'src/app/shared/page-url.constants';
import { SelfTestComponent } from 'src/app/shared/self-test/self-test.component';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { MockAdalService } from 'src/app/testing/mocks/MockAdalService';
import { MockLogger } from 'src/app/testing/mocks/MockLogger';
import { ParticipantSelfTestComponent } from './participant-self-test.component';
import { ParticipantStatusUpdateService } from 'src/app/services/participant-status-update.service';
import { fakeAsync, tick } from '@angular/core/testing';

describe('ParticipantSelfTestComponent', () => {
    let component: ParticipantSelfTestComponent;
    const conference = new ConferenceTestData().getConferenceDetailNow();

    let router: jasmine.SpyObj<Router>;
    const activatedRoute: ActivatedRoute = <any>{ snapshot: { paramMap: convertToParamMap({ conferenceId: conference.id }) } };
    let videoWebService: jasmine.SpyObj<VideoWebService>;
    const mockAdalService = new MockAdalService();
    let adalService;
    let errorService: jasmine.SpyObj<ErrorService>;
    const logger: Logger = new MockLogger();
    let participantStatusUpdateService: jasmine.SpyObj<ParticipantStatusUpdateService>;
    let selfTestSpy: jasmine.SpyObj<SelfTestComponent>;

    const pexipConfig = new SelfTestPexipResponse({
        pexip_self_test_node: 'selftest.automated.test'
    });

    beforeAll(() => {
        adalService = mockAdalService;
        adalService = mockAdalService;
        videoWebService = jasmine.createSpyObj<VideoWebService>('VideoWebService', [
            'getConferenceById',
            'getPexipConfig',
            'raiseSelfTestFailureEvent'
        ]);

        videoWebService.getConferenceById.and.returnValue(Promise.resolve(conference));
        videoWebService.getPexipConfig.and.returnValue(Promise.resolve(pexipConfig));
        videoWebService.raiseSelfTestFailureEvent.and.returnValue(Promise.resolve());

        participantStatusUpdateService = jasmine.createSpyObj('ParticipantStatusUpdateService', ['postParticipantStatus']);

        router = jasmine.createSpyObj<Router>('Router', ['navigate']);

        errorService = jasmine.createSpyObj<ErrorService>('ErrorService', [
            'goToServiceError',
            'handleApiError',
            'returnHomeIfUnauthorised'
        ]);
    });

    beforeEach(() => {
        selfTestSpy = jasmine.createSpyObj<SelfTestComponent>('SelfTestComponent', ['handleCallDisconnect', 'disconnect', 'replayVideo']);
        selfTestSpy.handleCallDisconnect.and.returnValue(Promise.resolve());
        selfTestSpy.replayVideo.and.callFake(() => {});

        component = new ParticipantSelfTestComponent(
            router,
            activatedRoute,
            videoWebService,
            errorService,
            adalService,
            logger,
            participantStatusUpdateService
        );
        component.conference = conference;
        component.conferenceId = conference.id;
        component.selfTestComponent = selfTestSpy;
        router.navigate.calls.reset();
    });

    it('should navigate to camera working screen', () => {
        component.selfTestCompleted = true;
        component.continueParticipantJourney();
        expect(router.navigate).toHaveBeenCalledWith([pageUrls.CameraWorking, conference.id]);
    });
    it('should navigate to camera working screen if self-test is incompleted', fakeAsync(() => {
        spyOn(logger, 'info');
        component.selfTestCompleted = false;
        component.continueParticipantJourney();
        tick();
        expect(videoWebService.raiseSelfTestFailureEvent).toHaveBeenCalled();
        expect(logger.info).toHaveBeenCalled();
        expect(router.navigate).toHaveBeenCalledWith([pageUrls.CameraWorking, conference.id]);
        expect(selfTestSpy.disconnect).toHaveBeenCalled();
        expect(selfTestSpy.handleCallDisconnect).toHaveBeenCalled();
    }));
    it('should log error if self-test is incompleted and raised event is failed', fakeAsync(() => {
        spyOn(logger, 'error');
        component.selfTestCompleted = false;
        videoWebService.raiseSelfTestFailureEvent.and.returnValue(Promise.reject());
        component.continueParticipantJourney();
        tick();
        expect(logger.error).toHaveBeenCalled();
        expect(router.navigate).toHaveBeenCalledWith([pageUrls.CameraWorking, conference.id]);
        expect(component.continueClicked).toBeTruthy();
    }));

    it('should set test in progress to false and test completed to true when test completes', () => {
        spyOn(component, 'continueParticipantJourney');
        const score = new TestCallScoreResponse({
            passed: true,
            score: TestScore.Good
        });
        component.onSelfTestCompleted(score);
        expect(component.testInProgress).toBeFalsy();
        expect(component.selfTestCompleted).toBeTruthy();
    });

    it('should show self test restarting video', () => {
        component.restartTest();

        expect(component.showEquipmentFaultMessage).toBeFalsy();
        expect(component.testInProgress).toBeFalsy();
        expect(component.hideSelfTest).toBeFalsy();
        expect(selfTestSpy.replayVideo).toHaveBeenCalled();
        expect(component.continueClicked).toBeFalsy();
    });
    it('should update participant status on log out', fakeAsync(() => {
        const event: any = { returnValue: 'save' };
        spyOn(logger, 'info');
        participantStatusUpdateService.postParticipantStatus.and.returnValue(Promise.resolve());

        component.beforeunloadHandler(event);
        tick();
        expect(participantStatusUpdateService.postParticipantStatus).toHaveBeenCalled();
        expect(logger.info).toHaveBeenCalled();
    }));
    it('should throw error message when update participant status on log out', fakeAsync(() => {
        const event: any = { returnValue: 'save' };
        spyOn(logger, 'error');
        participantStatusUpdateService.postParticipantStatus.and.returnValue(Promise.reject());
        component.beforeunloadHandler(event);
        tick();
        expect(participantStatusUpdateService.postParticipantStatus).toHaveBeenCalled();
        expect(logger.error).toHaveBeenCalled();
    }));
});
