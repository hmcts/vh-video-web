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

    const pexipConfig = new SelfTestPexipResponse({
        pexip_self_test_node: 'selftest.automated.test'
    });

    beforeAll(() => {
        adalService = mockAdalService;
        adalService = mockAdalService;
        videoWebService = jasmine.createSpyObj<VideoWebService>('VideoWebService', ['getConferenceById', 'getPexipConfig']);

        videoWebService.getConferenceById.and.returnValue(Promise.resolve(conference));
        videoWebService.getPexipConfig.and.returnValue(Promise.resolve(pexipConfig));

        participantStatusUpdateService = jasmine.createSpyObj('ParticipantStatusUpdateService', ['postParticipantStatus']);

        router = jasmine.createSpyObj<Router>('Router', ['navigate']);

        errorService = jasmine.createSpyObj<ErrorService>('ErrorService', [
            'goToServiceError',
            'handleApiError',
            'returnHomeIfUnauthorised'
        ]);
    });

    beforeEach(() => {
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
        router.navigate.calls.reset();
    });

    it('should navigate to camera working screen', () => {
        component.continueParticipantJourney();
        expect(router.navigate).toHaveBeenCalledWith([pageUrls.CameraWorking, conference.id]);
    });

    it('should set test in progress to false when test completes and continue', () => {
        spyOn(component, 'continueParticipantJourney');
        const score = new TestCallScoreResponse({
            passed: true,
            score: TestScore.Good
        });
        component.onSelfTestCompleted(score);
        expect(component.testInProgress).toBeFalsy();
        expect(component.continueParticipantJourney).toHaveBeenCalled();
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
});
