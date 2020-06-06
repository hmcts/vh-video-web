import { DomSanitizer } from '@angular/platform-browser';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { BehaviorSubject, Subscription } from 'rxjs';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { ConferenceStatus } from 'src/app/services/clients/api-client';
import { ErrorService } from 'src/app/services/error.service';
import { EventsService } from 'src/app/services/events.service';
import { Logger } from 'src/app/services/logging/logger-base';
import { UserMediaService } from 'src/app/services/user-media.service';
import { pageUrls } from 'src/app/shared/page-url.constants';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { MediaDeviceTestData } from 'src/app/testing/mocks/data/media-device-test-data';
import { MockEventsService } from 'src/app/testing/mocks/MockEventService';
import { MockLogger } from 'src/app/testing/mocks/MockLogger';
import { AudioRecordingService } from '../../services/api/audio-recording.service';
import { JudgeHearingPageComponent } from './judge-hearing-page.component';

describe('JudgeHearingPageComponent', () => {
    let component: JudgeHearingPageComponent;
    const conference = new ConferenceTestData().getConferenceDetailFuture();
    const activatedRoute: ActivatedRoute = <any>{ snapshot: { paramMap: convertToParamMap({ conferenceId: conference.id }) } };

    let router: jasmine.SpyObj<Router>;
    let videoWebService: jasmine.SpyObj<VideoWebService>;
    let eventsService: jasmine.SpyObj<EventsService>;
    let domSanitizer: jasmine.SpyObj<DomSanitizer>;
    let errorService: jasmine.SpyObj<ErrorService>;
    let userMediaService: jasmine.SpyObj<UserMediaService>;

    const mediaDeviceTestData = new MediaDeviceTestData();
    const mockEventService = new MockEventsService();
    const logger: Logger = new MockLogger();

    let audioRecordingServiceMock: jasmine.SpyObj<AudioRecordingService>;

    beforeAll(() => {
        router = jasmine.createSpyObj<Router>('Router', ['navigate']);
        audioRecordingServiceMock = jasmine.createSpyObj<AudioRecordingService>('AudioRecordingService', [
            'getAudioStreamInfo',
            'stopAudioRecording'
        ]);

        videoWebService = jasmine.createSpyObj<VideoWebService>('VideoWebService', ['getConferenceById']);
        videoWebService.getConferenceById.and.resolveTo(conference);
        eventsService = jasmine.createSpyObj<EventsService>('EventsService', [
            'getHearingStatusMessage',
            'getServiceDisconnected',
            'getServiceReconnected'
        ]);
        eventsService.getHearingStatusMessage.and.returnValue(mockEventService.hearingStatusSubject.asObservable());
        eventsService.getServiceReconnected.and.returnValue(mockEventService.eventHubReconnectSubject.asObservable());
        eventsService.getServiceReconnected.and.returnValue(mockEventService.eventHubReconnectSubject.asObservable());

        userMediaService = jasmine.createSpyObj<UserMediaService>('UserMediaService', ['getPreferredCamera', 'getPreferredMicrophone'], {
            connectedDevices: new BehaviorSubject(mediaDeviceTestData.getListOfDevices())
        });

        userMediaService.getPreferredCamera.and.resolveTo(mediaDeviceTestData.getListOfCameras()[0]);
        userMediaService.getPreferredMicrophone.and.resolveTo(mediaDeviceTestData.getListOfMicrophones()[0]);

        domSanitizer = jasmine.createSpyObj<DomSanitizer>('DomSanitizer', ['bypassSecurityTrustResourceUrl']);
        domSanitizer.bypassSecurityTrustResourceUrl.and.returnValue('test-url');

        errorService = jasmine.createSpyObj<ErrorService>('ErrorService', ['handleApiError']);

        audioRecordingServiceMock = jasmine.createSpyObj<AudioRecordingService>('AudioRecordingService', [
            'getAudioStreamInfo',
            'stopAudioRecording'
        ]);
        audioRecordingServiceMock.stopAudioRecording.and.callThrough();
    });

    beforeEach(async () => {
        component = new JudgeHearingPageComponent(
            activatedRoute,
            router,
            videoWebService,
            eventsService,
            domSanitizer,
            errorService,
            userMediaService,
            logger,
            audioRecordingServiceMock
        );
        component.conference = conference;

        videoWebService.getConferenceById.calls.reset();
        router.navigate.calls.reset();
        errorService.handleApiError.calls.reset();
    });

    it('should send judge to hearing list when conference is closed', () => {
        conference.status = ConferenceStatus.Closed;
        component.determineJudgeLocation();
        expect(router.navigate).toHaveBeenCalledWith([pageUrls.JudgeHearingList]);
    });

    it('should send judge to waiting room when conference is suspended', () => {
        spyOn(component, 'judgeURLChanged').and.callFake(() => {});
        const status = ConferenceStatus.Suspended;
        component.handleHearingStatusChange(status);
        expect(component.conference.status).toBe(status);
        expect(router.navigate).toHaveBeenCalledWith([pageUrls.JudgeWaitingRoom, conference.id]);
    });

    it('should send judge to waiting room when conference is paused', () => {
        spyOn(component, 'judgeURLChanged').and.callFake(() => {});
        const status = ConferenceStatus.Paused;
        component.handleHearingStatusChange(status);
        expect(component.conference.status).toBe(status);
        expect(router.navigate).toHaveBeenCalledWith([pageUrls.JudgeWaitingRoom, conference.id]);
    });

    it('should not send judge anywhere is conference is in session', () => {
        spyOn(component, 'judgeURLChanged').and.callFake(() => {});
        const status = ConferenceStatus.InSession;
        component.handleHearingStatusChange(status);
        expect(component.conference.status).toBe(status);
        expect(router.navigate).toHaveBeenCalledTimes(0);
    });

    it('should get conference and determine location when eventhub connection disconnects', async () => {
        spyOn(component, 'determineJudgeLocation');

        await component.refreshConferenceDataDuringDisconnect();

        expect(videoWebService.getConferenceById).toHaveBeenCalled();
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
        videoWebService.getConferenceById.and.rejectWith({ status: 401, isApiException: false });

        await component.ngOnInit();

        expect(component.conference).toBeUndefined();
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
    it('should stop audio recording', () => {
        component.conference.audio_recording_required = true;
        component.conference.hearing_ref_id = '1234567';
        component.stopAudioRecording();
        expect(audioRecordingServiceMock.stopAudioRecording).toHaveBeenCalled();
    });

    it('should clear subscriptions and intervals on destroy', () => {
        spyOn(window, 'clearInterval');
        const interval = jasmine.createSpyObj<NodeJS.Timer>('NodeJS.Timer', ['ref', 'unref']);
        component.interval = interval;
        component.eventHubSubscriptions = new Subscription();
        component.ngOnDestroy();

        expect(clearInterval).toHaveBeenCalledWith(interval);
    });
});
