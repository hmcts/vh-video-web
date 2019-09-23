import { HttpClientModule } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { configureTestSuite } from 'ng-bullet';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { TestCallScoreResponse, TestScore, AddSelfTestFailureEventRequest, SelfTestFailureReason } from 'src/app/services/clients/api-client';
import { Logger } from 'src/app/services/logging/logger-base';
import { UserMediaStreamService } from 'src/app/services/user-media-stream.service';
import { UserMediaService } from 'src/app/services/user-media.service';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { MockLogger } from 'src/app/testing/mocks/MockLogger';
import { MockUserMediaService } from 'src/app/testing/mocks/MockUserMediaService';
import { MockVideoWebService } from 'src/app/testing/mocks/MockVideoService';
import { ContactUsFoldingStubComponent } from 'src/app/testing/stubs/contact-us-stub';
import { MicVisualiserStubComponent } from 'src/app/testing/stubs/mic-visualiser-stub';
import { SelectMediaDevicesStubComponent } from 'src/app/testing/stubs/select-media-devices-stub';
import { SelfTestComponent } from './self-test.component';

describe('SelfTestComponent', () => {
    let component: SelfTestComponent;
    let fixture: ComponentFixture<SelfTestComponent>;
    let userMediaService: MockUserMediaService;
    let videoWebService: MockVideoWebService;
    let pexipSpy: any;
    let userMediaStreamServiceSpy: jasmine.SpyObj<UserMediaStreamService>;
    const testData = new ConferenceTestData();

    configureTestSuite(() => {
        userMediaStreamServiceSpy = jasmine.createSpyObj<UserMediaStreamService>('UserMediaStreamService',
            ['requestAccess', 'stopStream', 'getStreamForCam', 'getStreamForMic']);
        userMediaStreamServiceSpy.requestAccess.and.returnValue(true);

        pexipSpy = jasmine.createSpyObj('pexipAPI',
            ['onSetup', 'connect', 'onConnect', 'onError', 'onDisconnect', 'makeCall']);

        TestBed.configureTestingModule({
            imports: [RouterTestingModule, HttpClientModule],
            providers: [
                { provide: Logger, useClass: MockLogger },
                { provide: VideoWebService, useClass: MockVideoWebService },
                { provide: UserMediaService, useClass: MockUserMediaService },
                { provide: UserMediaStreamService, useValue: userMediaStreamServiceSpy }
            ],
            declarations: [SelfTestComponent, MicVisualiserStubComponent, ContactUsFoldingStubComponent, SelectMediaDevicesStubComponent]
        });
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(SelfTestComponent);
        component = fixture.componentInstance;
        component.pexipAPI = pexipSpy;
        component.conference = testData.getConferenceDetail();
        component.participant = component.conference.participants[0];
        userMediaService = TestBed.get(UserMediaService);
        videoWebService = TestBed.get(VideoWebService);
        spyOn(component, 'call').and.callFake(() => { });
        spyOn(component, 'disconnect').and.callFake(() => { });
        fixture.detectChanges();
    });

    it('should emit test complete event', () => {
        spyOn(component.testCompleted, 'emit');
        const testCallScoreResponse = new TestCallScoreResponse({
            passed: true,
            score: TestScore.Good
        });
        component.didTestComplete = true;
        component.testCallResult = testCallScoreResponse;

        component.publishTestResult();

        expect(component.testCompleted.emit).toHaveBeenCalledWith(testCallScoreResponse);
    });

    it('should disconnect from pexip when publishing prematurely', () => {
        spyOn(component.testCompleted, 'emit');
        const testCallScoreResponse = null;
        component.didTestComplete = false;
        component.testCallResult = testCallScoreResponse;

        component.publishTestResult();
        expect(component.disconnect).toHaveBeenCalled();
    });

    it('should raise failed self test event when test score is bad', async () => {
        spyOn(videoWebService, 'raiseSelfTestFailureEvent');
        component.testCallResult = new TestCallScoreResponse({ passed: false, score: TestScore.Bad });
        await component.ngOnDestroy();
        const request = new AddSelfTestFailureEventRequest({
            participant_id: component.participant.id,
            self_test_failure_reason: SelfTestFailureReason.BadScore
        });
        expect(videoWebService.raiseSelfTestFailureEvent).toHaveBeenCalledWith(component.conference.id, request);
    });

    it('should raise failed self test event when test is incomplete', async () => {
        spyOn(videoWebService, 'raiseSelfTestFailureEvent');
        component.testCallResult = null;
        await component.ngOnDestroy();
        const request = new AddSelfTestFailureEventRequest({
            participant_id: component.participant.id,
            self_test_failure_reason: SelfTestFailureReason.IncompleteTest
        });
        expect(videoWebService.raiseSelfTestFailureEvent).toHaveBeenCalledWith(component.conference.id, request);
    });

    it('should not raise failed self test event when score has already been sent', async () => {
        spyOn(videoWebService, 'raiseSelfTestFailureEvent');
        component.scoreSent = true;
        await component.ngOnDestroy();
        const request = new AddSelfTestFailureEventRequest({
            participant_id: component.participant.id,
            self_test_failure_reason: SelfTestFailureReason.IncompleteTest
        });
        expect(videoWebService.raiseSelfTestFailureEvent).toHaveBeenCalledTimes(0);
    });
});
