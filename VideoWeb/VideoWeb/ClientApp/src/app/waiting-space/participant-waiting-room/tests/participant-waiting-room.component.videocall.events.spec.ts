import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { AdalService } from 'adal-angular4';
import { ConsultationService } from 'src/app/services/api/consultation.service';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { ConferenceResponse, ConferenceStatus, ParticipantResponse, Role, TokenResponse } from 'src/app/services/clients/api-client';
import { ClockService } from 'src/app/services/clock.service';
import { DeviceTypeService } from 'src/app/services/device-type.service';
import { ErrorService } from 'src/app/services/error.service';
import { Logger } from 'src/app/services/logging/logger-base';
import { HeartbeatModelMapper } from 'src/app/shared/mappers/heartbeat-model-mapper';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { eventsServiceSpy } from 'src/app/testing/mocks/mock-events-service';
import {
    onConnectedSubjectMock,
    onDisconnectedSubjectMock,
    onErrorSubjectMock,
    onSetupSubjectMock,
    videoCallServiceSpy,
    onParticipantUpdatedMock
} from 'src/app/testing/mocks/mock-video-call-service';
import { MockLogger } from 'src/app/testing/mocks/MockLogger';
import { Hearing } from '../../../shared/models/hearing';
import { CallError, CallSetup, ConnectedCall, DisconnectedCall, ParticipantUpdated } from '../../models/video-call-models';
import { ParticipantWaitingRoomComponent } from '../participant-waiting-room.component';

describe('ParticipantWaitingRoomComponent video call events', () => {
    let component: ParticipantWaitingRoomComponent;
    const gloalConference = new ConferenceTestData().getConferenceDetailPast() as ConferenceResponse;
    const globalParticipant = gloalConference.participants.filter(x => x.role === Role.Individual)[0];

    const onSetupSubject = onSetupSubjectMock;
    const onConnectedSubject = onConnectedSubjectMock;
    const onDisconnectedSubject = onDisconnectedSubjectMock;
    const onErrorSubject = onErrorSubjectMock;
    const onParticipantUpdatedSubject = onParticipantUpdatedMock;
    const videoCallService = videoCallServiceSpy;

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
    });

    beforeEach(async () => {
        component = new ParticipantWaitingRoomComponent(
            activatedRoute,
            videoWebService,
            eventsService,
            adalService,
            errorService,
            clockService,
            logger,
            consultationService,
            router,
            heartbeatModelMapper,
            deviceTypeService,
            videoCallService
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
        component.videoCallSubscription$.unsubscribe();
        if (component.callbackTimeout) {
            clearTimeout(component.callbackTimeout);
        }
    });

    it('should init pexip setup to be called on start', () => {
        expect(videoCallService.setupClient).toHaveBeenCalled();
    });

    it('should define outgoing stream when video call has been setup', () => {
        const currentShowSelfVideo = component.showSelfView;
        const outgoingStream = <any>{};
        const payload = new CallSetup(outgoingStream);
        onSetupSubject.next(payload);

        expect(videoCallService.connect).toHaveBeenCalledWith('', null);
        expect(component.outgoingStream).toBeDefined();
        expect(component.showSelfView).toBe(currentShowSelfVideo);
    });

    it('should define incoming stream when video call has connected', () => {
        const mockedDocElement = document.createElement('div');
        document.getElementById = jasmine.createSpy('incomingFeed').and.returnValue(mockedDocElement);

        spyOn(component, 'setupParticipantHeartbeat').and.callFake(() => (component.heartbeat = mockHeartbeat));
        spyOn(component, 'assignStream');
        spyOnProperty(window, 'navigator').and.returnValue({
            userAgent: 'Chrome'
        });
        const incomingStream = <any>{};
        const payload = new ConnectedCall(incomingStream);

        onConnectedSubject.next(payload);

        expect(component.stream).toBeDefined();
        expect(component.errorCount).toBe(0);
        expect(component.connected).toBeTruthy();
        expect(component.setupParticipantHeartbeat).toHaveBeenCalled();
        expect(component.assignStream).toHaveBeenCalled();
        expect(component.heartbeat).toBeTruthy();
    });

    it('should not define incoming stream when video call has connected but not stream if given', () => {
        spyOn(component, 'setupParticipantHeartbeat').and.callFake(() => (component.heartbeat = mockHeartbeat));
        spyOn(component, 'assignStream');
        spyOnProperty(window, 'navigator').and.returnValue({
            userAgent: 'Chrome'
        });
        const incomingStream = null;
        const payload = new ConnectedCall(incomingStream);

        onConnectedSubject.next(payload);

        expect(component.stream).toBeDefined();
        expect(component.errorCount).toBe(0);
        expect(component.connected).toBeTruthy();
        expect(component.setupParticipantHeartbeat).toHaveBeenCalled();
        expect(component.assignStream).toHaveBeenCalledTimes(0);
        expect(component.heartbeat).toBeTruthy();
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

    it('should go to service error when video call failed more than 3 times', () => {
        const currentErrorCount = (component.errorCount = 3);
        const payload = new CallError('test failure intentional');
        component.heartbeat = mockHeartbeat;

        onErrorSubject.next(payload);

        expect(component.connected).toBeFalsy();
        expect(component.heartbeat.kill).toHaveBeenCalled();
        expect(component.errorCount).toBeGreaterThan(currentErrorCount);
        expect(component.showVideo).toBeFalsy();
        expect(errorService.goToServiceError).toHaveBeenCalledWith('Your connection was lost');
    });

    it('should hide video when video call has disconnected and attempt to connect again', () => {
        component.heartbeat = mockHeartbeat;
        const payload = new DisconnectedCall('test failure intentional');
        component.heartbeat = mockHeartbeat;

        onDisconnectedSubject.next(payload);

        expect(component.connected).toBeFalsy();
        expect(component.heartbeat.kill).toHaveBeenCalled();
        expect(component.showVideo).toBeFalsy();
        expect(component.callbackTimeout).toBeDefined();
    });

    it('should stop reconnection on disconnect when hearing has been closed beyond 30 minutes', () => {
        const c = new ConferenceTestData().getConferenceDetailFuture();
        c.status = ConferenceStatus.Closed;
        const closedDateTime = new Date(new Date().toUTCString());
        closedDateTime.setUTCMinutes(closedDateTime.getUTCMinutes() - 30);
        c.closed_date_time = closedDateTime;
        component.hearing = new Hearing(c);
        component.conference = c;

        component.heartbeat = mockHeartbeat;
        const payload = new DisconnectedCall('test failure intentional');
        component.heartbeat = mockHeartbeat;

        onDisconnectedSubject.next(payload);

        expect(component.connected).toBeFalsy();
        expect(component.heartbeat.kill).toHaveBeenCalled();
        expect(component.showVideo).toBeFalsy();
        expect(component.callbackTimeout).toBeUndefined();
    });

    it('should raise hand on toggle if hand not raised', () => {
        component.handRaised = false;
        component.toggleHandRaised();
        expect(videoCallService.raiseHand).toHaveBeenCalledTimes(1);
    });

    it('should lower hand on toggle if hand raised', () => {
        component.handRaised = true;
        component.toggleHandRaised();
        expect(videoCallService.lowerHand).toHaveBeenCalledTimes(1);
    });

    it('should show raised hand on hand lowered', () => {
        const payload = new ParticipantUpdated('Yes', 0);
        onParticipantUpdatedMock.next(payload);

        expect(component.handRaised).toBeFalsy();
    });

    it('should show lower hand on hand raised', () => {
        const payload = new ParticipantUpdated('Yes', 123);
        onParticipantUpdatedMock.next(payload);

        expect(component.handRaised).toBeTruthy();
    });
});
