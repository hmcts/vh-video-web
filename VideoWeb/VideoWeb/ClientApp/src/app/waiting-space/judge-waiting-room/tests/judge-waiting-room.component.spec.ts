import { fakeAsync, flushMicrotasks } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { AdalService } from 'adal-angular4';
import { AudioRecordingService } from 'src/app/services/api/audio-recording.service';
import { ConsultationService } from 'src/app/services/api/consultation.service';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import {
    ConferenceResponse,
    ConferenceStatus,
    HearingLayout,
    ParticipantResponse,
    Role,
    TokenResponse
} from 'src/app/services/clients/api-client';
import { ClockService } from 'src/app/services/clock.service';
import { DeviceTypeService } from 'src/app/services/device-type.service';
import { ErrorService } from 'src/app/services/error.service';
import { Logger } from 'src/app/services/logging/logger-base';
import { HeartbeatModelMapper } from 'src/app/shared/mappers/heartbeat-model-mapper';
import { Hearing } from 'src/app/shared/models/hearing';
import { pageUrls } from 'src/app/shared/page-url.constants';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { eventsServiceSpy } from 'src/app/testing/mocks/mock-events-service';
import { onErrorSubjectMock, videoCallServiceSpy } from 'src/app/testing/mocks/mock-video-call-service';
import { MockLogger } from 'src/app/testing/mocks/MockLogger';
import { CallError } from '../../models/video-call-models';
import { JudgeWaitingRoomComponent } from '../judge-waiting-room.component';

describe('JudgeWaitingRoomComponent when conference exists', () => {
    let component: JudgeWaitingRoomComponent;
    const gloalConference = new ConferenceTestData().getConferenceDetailPast() as ConferenceResponse;
    const globalParticipant = gloalConference.participants.filter(x => x.role === Role.Individual)[0];
    const videoCallService = videoCallServiceSpy;
    const onErrorSubject = onErrorSubjectMock;

    const activatedRoute: ActivatedRoute = <any>{ snapshot: { paramMap: convertToParamMap({ conferenceId: gloalConference.id }) } };
    let videoWebService: jasmine.SpyObj<VideoWebService>;
    const eventsService = eventsServiceSpy;
    let adalService: jasmine.SpyObj<AdalService>;
    let errorService: jasmine.SpyObj<ErrorService>;

    let clockService: jasmine.SpyObj<ClockService>;
    let router: jasmine.SpyObj<Router>;
    let heartbeatModelMapper: HeartbeatModelMapper;
    let deviceTypeService: jasmine.SpyObj<DeviceTypeService>;

    let consultationService: jasmine.SpyObj<ConsultationService>;
    const logger: Logger = new MockLogger();

    let audioRecordingService: jasmine.SpyObj<AudioRecordingService>;

    const mockHeartbeat = {
        kill: jasmine.createSpy()
    };

    const jwToken = new TokenResponse({
        expires_on: '06/10/2020 01:13:00',
        token:
            'eyJhbGciOiJIUzUxMuIsInR5cCI6IkpXRCJ9.eyJ1bmlxdWVfbmFtZSI6IjA0NjllNGQzLTUzZGYtNGExYS04N2E5LTA4OGI0MmExMTQxMiIsIm5iZiI6MTU5MTcyMjcyMCwiZXhwIjoxNTkxNzUxNjQwLCJpYXQiOjE1OTE3MjI3ODAsImlzcyI6ImhtY3RzLnZpZGVvLmhlYXJpbmdzLnNlcnZpY2UifO.USebpA7R7GUiPwF-uSuAd7Sx-bveOFi8LNE3oV7SLxdxASTlq7MfwhgYJhaC69OQAhWcrV7wSdcZ2OS-ZHkSUg'
    });

    beforeAll(() => {
        videoWebService = jasmine.createSpyObj<VideoWebService>('VideoWebService', [
            'getConferenceById',
            'getObfuscatedName',
            'getJwToken'
        ]);
        videoWebService.getConferenceById.and.resolveTo(gloalConference);
        videoWebService.getObfuscatedName.and.returnValue('t***** u*****');
        videoWebService.getJwToken.and.resolveTo(jwToken);

        adalService = jasmine.createSpyObj<AdalService>('AdalService', ['init', 'handleWindowCallback', 'userInfo', 'logOut'], {
            userInfo: <adal.User>{ userName: globalParticipant.username, authenticated: true }
        });
        errorService = jasmine.createSpyObj<ErrorService>('ErrorService', ['goToServiceError', 'handleApiError']);

        clockService = jasmine.createSpyObj<ClockService>('ClockService', ['getClock']);
        router = jasmine.createSpyObj<Router>('Router', ['navigate']);
        heartbeatModelMapper = new HeartbeatModelMapper();
        deviceTypeService = jasmine.createSpyObj<DeviceTypeService>('DeviceTypeService', ['getBrowserName', 'getBrowserVersion']);
        consultationService = jasmine.createSpyObj<ConsultationService>('ConsultationService', ['leaveConsultation']);
        audioRecordingService = jasmine.createSpyObj<AudioRecordingService>('AudioRecordingService', ['getAudioStreamInfo']);
    });

    beforeEach(async () => {
        component = new JudgeWaitingRoomComponent(
            activatedRoute,
            videoWebService,
            eventsService,
            adalService,
            logger,
            errorService,
            heartbeatModelMapper,
            videoCallService,
            deviceTypeService,
            router,
            consultationService,
            audioRecordingService
        );

        const conference = new ConferenceResponse(Object.assign({}, gloalConference));
        const participant = new ParticipantResponse(Object.assign({}, globalParticipant));
        component.hearing = new Hearing(conference);
        component.conference = conference;
        component.participant = participant;
        component.connected = true; // assume connected to pexip
        await component.setupPexipEventSubscriptionAndClient();
        videoWebService.getConferenceById.calls.reset();
    });

    afterEach(() => {
        component.ngOnDestroy();
        if (component.callbackTimeout) {
            clearTimeout(component.callbackTimeout);
        }

        if (component.audioRecordingInterval) {
            clearInterval(component.callbackTimeout);
        }
    });

    it('should init hearing alert and subscribers', fakeAsync(() => {
        component.ngOnInit();
        flushMicrotasks();
        expect(component.eventHubSubscription$).toBeDefined();
        expect(component.videoCallSubscription$).toBeDefined();
        expect(videoCallService.setupClient).toHaveBeenCalled();
    }));

    it('should return correct conference status text when suspended', async () => {
        component.conference.status = ConferenceStatus.Suspended;
        expect(component.getConferenceStatusText()).toBe('Hearing suspended');
    });

    it('should return correct conference status text when paused', async () => {
        component.conference.status = ConferenceStatus.Paused;
        expect(component.getConferenceStatusText()).toBe('Hearing paused');
    });

    it('should return correct conference status text when closed', async () => {
        component.conference.status = ConferenceStatus.Closed;
        expect(component.getConferenceStatusText()).toBe('Hearing is closed');
    });

    it('should return correct conference status text when in session', async () => {
        component.conference.status = ConferenceStatus.InSession;
        expect(component.getConferenceStatusText()).toBe('Hearing is in session');
    });

    it('should return correct conference status text when not started', async () => {
        component.conference.status = ConferenceStatus.NotStarted;
        expect(component.getConferenceStatusText()).toBe('Start this hearing');
    });

    it('should return true when conference is paused', async () => {
        component.conference.status = ConferenceStatus.Paused;
        expect(component.isPaused()).toBeTruthy();
    });

    it('should return false when conference is not paused', async () => {
        component.conference.status = ConferenceStatus.InSession;
        expect(component.isPaused()).toBeFalsy();
    });

    it('should return true when conference is not started', async () => {
        component.conference.status = ConferenceStatus.NotStarted;
        expect(component.isNotStarted()).toBeTruthy();
    });

    it('should return false when conference is has started', async () => {
        component.conference.status = ConferenceStatus.InSession;
        expect(component.isNotStarted()).toBeFalsy();
    });

    it('should navigate to check equipment with conference id', async () => {
        component.checkEquipment();
        expect(router.navigate).toHaveBeenCalledWith([pageUrls.EquipmentCheck, component.conference.id]);
    });

    it('should navigate to judge hearing list', async () => {
        component.goToJudgeHearingList();
        expect(router.navigate).toHaveBeenCalledWith([pageUrls.JudgeHearingList]);
    });

    it('should return "hearingSuspended" true when conference status is suspended', () => {
        component.conference.status = ConferenceStatus.Suspended;
        expect(component.hearingSuspended()).toBeTruthy();
    });

    it('should return "hearingSuspended" false when conference status is not suspended', () => {
        component.conference.status = ConferenceStatus.InSession;
        expect(component.hearingSuspended()).toBeFalsy();
    });

    it('should return "hearingPaused" true when conference status is paused', () => {
        component.conference.status = ConferenceStatus.Paused;
        expect(component.hearingPaused()).toBeTruthy();
    });

    it('should return "hearingPaused" false when conference status is not paused', () => {
        component.conference.status = ConferenceStatus.InSession;
        expect(component.hearingPaused()).toBeFalsy();
    });

    it('should handle error when get conference fails', async () => {
        const error = { status: 401, isApiException: true };
        videoWebService.getConferenceById.and.rejectWith(error);

        await component.getConference();

        expect(errorService.handleApiError).toHaveBeenCalledWith(error);
    });

    it('should hide video when video call failed', () => {
        const currentErrorCount = (component.errorCount = 0);
        const payload = new CallError('test failure intentional');
        component.heartbeat = mockHeartbeat;

        onErrorSubject.next(payload);

        expect(component.connected).toBeFalsy();
        expect(component.heartbeat.kill).toHaveBeenCalled();
        expect(component.errorCount).toBeGreaterThan(currentErrorCount);
        expect(component.showVideo).toBeFalsy();
        expect(errorService.goToServiceError).toHaveBeenCalledTimes(0);
    });

    it('should start the hearing', () => {
        const layout = HearingLayout.TwoPlus21;
        videoCallService.getPreferredLayout.and.returnValue(layout);
        component.startHearing();
        expect(videoCallService.startHearing).toHaveBeenCalledWith(component.conference.id, layout);
    });

    it('should close audio  alert  for judge', () => {
        component.closeAlert(true);
        expect(component.continueWithNoRecording).toBeTruthy();
    });

    it('should stop to show alert if it was already closed by judge', async () => {
        audioRecordingService.getAudioStreamInfo.and.throwError('Error');
        await component.retrieveAudioStreamInfo(gloalConference.id);
        component.closeAlert(true);

        expect(component.showAudioRecordingAlert).toBeFalsy();
    });

    it('should display audio recording alert when audio info throws an error and hearing must be recorded', async () => {
        audioRecordingService.getAudioStreamInfo.and.throwError('Error');
        await component.retrieveAudioStreamInfo(gloalConference.id);
        expect(component.showAudioRecordingAlert).toBeTruthy();
    });

    it('should not display audio recording alert when audio info throws an error and hearing must be recorded', async () => {
        audioRecordingService.getAudioStreamInfo.and.throwError('Error');
        component.continueWithNoRecording = false;
        await component.retrieveAudioStreamInfo(gloalConference.id);

        expect(component.showAudioRecordingAlert).toBeTruthy();
    });

    it('should not display audio recording alert when audio info returns true', async () => {
        audioRecordingService.getAudioStreamInfo.and.returnValue(Promise.resolve(true));
        await component.retrieveAudioStreamInfo(gloalConference.id);

        expect(component.showAudioRecordingAlert).toBeFalsy();
    });

    it('should display audio recording alert when audio info returns false and hearing must be recorded', async () => {
        audioRecordingService.getAudioStreamInfo.and.returnValue(Promise.resolve(false));
        component.continueWithNoRecording = false;
        await component.retrieveAudioStreamInfo(gloalConference.id);

        expect(component.showAudioRecordingAlert).toBeTruthy();
    });

    it('should init audio recording interval', () => {
        spyOn(component, 'retrieveAudioStreamInfo');
        component.initAudioRecordingInterval();
        expect(component.audioRecordingInterval).toBeDefined();
    });
});
