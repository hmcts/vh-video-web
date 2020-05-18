import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { AdalService } from 'adal-angular4';
import { configureTestSuite } from 'ng-bullet';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { ConferenceResponse, ConferenceStatus } from 'src/app/services/clients/api-client';
import { ErrorService } from 'src/app/services/error.service';
import { EventsService } from 'src/app/services/events.service';
import { Logger } from 'src/app/services/logging/logger-base';
import { pageUrls } from 'src/app/shared/page-url.constants';
import { SharedModule } from 'src/app/shared/shared.module';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { MockAdalService } from 'src/app/testing/mocks/MockAdalService';
import { MockEventsNonHttpService, MockEventsService } from 'src/app/testing/mocks/MockEventService';
import { MockLogger } from 'src/app/testing/mocks/MockLogger';
import { MockVideoWebService } from 'src/app/testing/mocks/MockVideoService';
import { AudioRecordingService } from '../../services/api/audio-recording.service';
import { AudioAlertComponent } from '../audio-alert/audio-alert.component';
import { JudgeHearingPageComponent } from './judge-hearing-page.component';

describe('JudgeHearingPageComponent when conference in session', () => {
    let component: JudgeHearingPageComponent;
    let fixture: ComponentFixture<JudgeHearingPageComponent>;
    const videoWebServiceMock = new MockVideoWebService();
    let router: Router;
    let conference: ConferenceResponse;
    let adalService: MockAdalService;
    let eventService: MockEventsNonHttpService;
    let errorService: ErrorService;
    let audioRecordingServiceMock: jasmine.SpyObj<AudioRecordingService>;

    configureTestSuite(() => {
        conference = new ConferenceTestData().getConferenceDetailFuture();
        audioRecordingServiceMock = jasmine.createSpyObj<AudioRecordingService>('AudioRecordingService', ['getAudioStreamInfo']);
        TestBed.configureTestingModule({
            imports: [SharedModule, RouterTestingModule],
            declarations: [JudgeHearingPageComponent, AudioAlertComponent],
            providers: [
                {
                    provide: ActivatedRoute,
                    useValue: {
                        snapshot: {
                            paramMap: convertToParamMap({ conferenceId: conference.id })
                        }
                    }
                },
                { provide: VideoWebService, useValue: videoWebServiceMock },
                { provide: AdalService, useClass: MockAdalService },
                { provide: EventsService, useClass: MockEventsService },
                { provide: Logger, useClass: MockLogger },
                { provide: AudioRecordingService, useValue: audioRecordingServiceMock }
            ]
        });
    });

    beforeEach(async () => {
        adalService = TestBed.get(AdalService);
        eventService = TestBed.get(EventsService);
        errorService = TestBed.get(ErrorService);
        router = TestBed.get(Router);
        fixture = TestBed.createComponent(JudgeHearingPageComponent);
        component = fixture.componentInstance;
        component.conference = conference;

        spyOn(component, 'sanitiseIframeUrl').and.callFake(() => Promise.resolve());
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should send judge to hearing list when conference is closed', () => {
        spyOn(router, 'navigate').and.callFake(() => Promise.resolve(true));
        conference.status = ConferenceStatus.Closed;
        component.determineJudgeLocation();
        expect(router.navigate).toHaveBeenCalledWith([pageUrls.JudgeHearingList]);
    });

    it('should send judge to waiting room when conference is suspended', () => {
        spyOn(router, 'navigate').and.callFake(() => Promise.resolve(true));
        spyOn(component, 'judgeURLChanged').and.callFake(() => {});
        const status = ConferenceStatus.Suspended;
        component.handleHearingStatusChange(status);
        expect(component.conference.status).toBe(status);
        expect(router.navigate).toHaveBeenCalledWith([pageUrls.JudgeWaitingRoom, conference.id]);
    });

    it('should send judge to waiting room when conference is paused', () => {
        spyOn(router, 'navigate').and.callFake(() => Promise.resolve(true));
        spyOn(component, 'judgeURLChanged').and.callFake(() => {});
        const status = ConferenceStatus.Paused;
        component.handleHearingStatusChange(status);
        expect(component.conference.status).toBe(status);
        expect(router.navigate).toHaveBeenCalledWith([pageUrls.JudgeWaitingRoom, conference.id]);
    });

    it('should not send judge anywhere is conference is in session', () => {
        spyOn(router, 'navigate').and.callFake(() => Promise.resolve(true));
        spyOn(component, 'judgeURLChanged').and.callFake(() => {});
        const status = ConferenceStatus.InSession;
        component.handleHearingStatusChange(status);
        expect(component.conference.status).toBe(status);
        expect(router.navigate).toHaveBeenCalledTimes(0);
    });

    it('should get conference and determine location when eventhub connection disconnects', async () => {
        spyOn(videoWebServiceMock, 'getConferenceById');
        spyOn(component, 'determineJudgeLocation');

        await component.refreshConferenceDataDuringDisconnect();

        expect(videoWebServiceMock.getConferenceById).toHaveBeenCalled();
        expect(component.determineJudgeLocation).toHaveBeenCalled();
    });

    it('should connect to iframe on load', async () => {
        component.conference = undefined;
        await component.ngOnInit();

        expect(component.loadingData).toBeFalsy();
        expect(component.conference).toBeDefined();
    });

    it('should return home if user not authorised', async () => {
        component.conference = undefined;
        spyOn(videoWebServiceMock, 'getConferenceById').and.callFake(() => Promise.reject({ status: 401, isApiException: false }));
        spyOn(errorService, 'returnHomeIfUnauthorised');
        spyOn(errorService, 'handleApiError');

        await component.ngOnInit();

        expect(component.conference).toBeUndefined();
        expect(errorService.returnHomeIfUnauthorised).toBeTruthy();
        expect(errorService.handleApiError).toHaveBeenCalledTimes(0);
    });
    it('should retrieve audio recording stream and if an error then alert judge', () => {
        audioRecordingServiceMock.getAudioStreamInfo.and.throwError('Error');
        const hearingId = '5256626262626';
        component.retrieveAudioStreamInfo(hearingId);

        expect(component.showAudioRecordingAlert).toBeTruthy();
    });
    it('should stop to show alert if it was already closed by judge', () => {
        audioRecordingServiceMock.getAudioStreamInfo.and.throwError('Error');
        const hearingId = '5256626262626';
        component.retrieveAudioStreamInfo(hearingId);
        component.closeAlert(true);

        expect(component.showAudioRecordingAlert).toBeFalsy();
    });
    it('should close audio  alert  for judge', () => {
        component.closeAlert(true);
        expect(component.continueWithNoRecording).toBeTruthy();
    });
    it('should retrieve audio recording stream and if no error then no alert', () => {
        audioRecordingServiceMock.getAudioStreamInfo.and.returnValue(Promise.resolve(true));
        const hearingId = '5256626262626';
        component.retrieveAudioStreamInfo(hearingId);

        expect(component.showAudioRecordingAlert).toBeFalsy();
    });
});
