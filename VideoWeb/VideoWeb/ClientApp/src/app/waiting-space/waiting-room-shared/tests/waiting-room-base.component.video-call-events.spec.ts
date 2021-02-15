import { ConferenceResponse, ConferenceStatus, ParticipantResponse } from 'src/app/services/clients/api-client';
import { Hearing } from 'src/app/shared/models/hearing';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import {
    onSetupSubjectMock,
    onConnectedSubjectMock,
    onDisconnectedSubjectMock,
    onErrorSubjectMock,
    onCallTransferredMock
} from 'src/app/testing/mocks/mock-video-call-service';
import { CallSetup, ConnectedCall, CallError, DisconnectedCall } from '../../models/video-call-models';
import {
    activatedRoute,
    adalService,
    clockService,
    consultationService,
    deviceTypeService,
    errorService,
    eventsService,
    globalConference,
    globalParticipant,
    heartbeatModelMapper,
    initAllWRDependencies,
    logger,
    notificationSoundsService,
    notificationToastrService,
    router,
    userMediaService,
    userMediaStreamService,
    videoCallService,
    videoWebService
} from './waiting-room-base-setup';
import { WRTestComponent } from './WRTestComponent';

describe('WaitingRoomComponent Video Call', () => {
    let component: WRTestComponent;
    const mockHeartbeat = {
        kill: jasmine.createSpy()
    };

    const onSetupSubject = onSetupSubjectMock;
    const onConnectedSubject = onConnectedSubjectMock;
    const onDisconnectedSubject = onDisconnectedSubjectMock;
    const onErrorSubject = onErrorSubjectMock;
    const onTransferSubject = onCallTransferredMock;

    beforeAll(() => {
        initAllWRDependencies();
    });

    beforeEach(async () => {
        component = new WRTestComponent(
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
            userMediaService,
            userMediaStreamService,
            notificationSoundsService,
            notificationToastrService,
            clockService
        );

        const conference = new ConferenceResponse(Object.assign({}, globalConference));
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

    it('should get token and connect to video call', async () => {
        videoCallService.makeCall.calls.reset();

        await component.getJwtokenAndConnectToPexip();
        expect(component.token).toBeDefined();
        expect(videoCallService.makeCall).toHaveBeenCalled();
    });

    it('should init pexip setup to be called on start', () => {
        expect(videoCallService.setupClient).toHaveBeenCalled();
    });

    it('should define outgoing stream when video call has been setup', () => {
        const outgoingStream = <any>{};
        const payload = new CallSetup(outgoingStream);
        onSetupSubject.next(payload);

        expect(videoCallService.connect).toHaveBeenCalledWith('', null);
        expect(component.outgoingStream).toBeDefined();
    });

    it('should define incoming stream when video call has connected', () => {
        const mockedDocElement = document.createElement('div');
        document.getElementById = jasmine.createSpy('incomingFeed').and.returnValue(mockedDocElement);

        spyOn(component, 'setupParticipantHeartbeat').and.callFake(() => (component.heartbeat = mockHeartbeat));
        spyOn(component, 'assignStream');
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
        expect(errorService.handlePexipError).toHaveBeenCalledWith(payload, component.conference.id);
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

    it('should dettach current stream on transfer', () => {
        const incomingStream = <any>{};
        component.stream = incomingStream;
        onTransferSubject.next('new_room');
        expect(component.stream).toBeNull();
    });
});
