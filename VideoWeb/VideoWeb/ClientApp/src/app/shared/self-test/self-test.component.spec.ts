import { SelfTestComponent } from './self-test.component';
import { MockLogger } from 'src/app/testing/mocks/MockLogger';
import { Logger } from 'src/app/services/logging/logger-base';
import { MockVideoWebService } from 'src/app/testing/mocks/MockVideoService';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { configureTestSuite } from 'ng-bullet';
import { UserMediaService } from 'src/app/services/user-media.service';
import { MockUserMediaService } from 'src/app/testing/mocks/MockUserMediaService';
import { UserMediaStreamService } from 'src/app/services/user-media-stream.service';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { TestCallScoreResponse, TestScore } from 'src/app/services/clients/api-client';
import { MicVisualiserStubComponent } from 'src/app/testing/stubs/mic-visualiser-stub';
import { ContactUsFoldingStubComponent } from 'src/app/testing/stubs/contact-us-stub';
import { SelectMediaDevicesComponent } from '../select-media-devices/select-media-devices.component';
import { SelectMediaDevicesStubComponent } from 'src/app/testing/stubs/select-media-devices-stub';
import { HttpClientModule } from '@angular/common/http';
import { RouterTestingModule } from '@angular/router/testing';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';

describe('SelfTestComponent', () => {
    let component: SelfTestComponent;
    let fixture: ComponentFixture<SelfTestComponent>;
    let userMediaService: MockUserMediaService;
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
});
