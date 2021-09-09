import { fakeAsync, flush, tick } from '@angular/core/testing';
import { ConferenceResponse, ConferenceStatus, ParticipantResponse, TokenResponse } from 'src/app/services/clients/api-client';
import { Hearing } from 'src/app/shared/models/hearing';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import {
    onSetupSubjectMock,
    onConnectedSubjectMock,
    onDisconnectedSubjectMock,
    onErrorSubjectMock,
    onCallTransferredMock,
    onPresentationConnectedMock,
    onPresentationDisconnectedMock,
    onPresentationMock
} from 'src/app/testing/mocks/mock-video-call.service';
import {
    CallSetup,
    ConnectedCall,
    CallError,
    DisconnectedCall,
    Presentation,
    ConnectedPresentation,
    DisconnectedPresentation
} from '../../models/video-call-models';
import { PrivateConsultationRoomControlsComponent } from '../../private-consultation-room-controls/private-consultation-room-controls.component';
import {
    activatedRoute,
    clockService,
    consultationInvitiationService,
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
    roomClosingToastrService,
    router,
    userMediaService,
    userMediaStreamService,
    videoCallService,
    videoWebService
} from './waiting-room-base-setup';
import { WRTestComponent } from './WRTestComponent';
import { eventsServiceSpy } from 'src/app/testing/mocks/mock-events-service';
import { Subject } from 'rxjs';

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
    const onPresentationConnected = onPresentationConnectedMock;
    const onPresentationDisconnected = onPresentationDisconnectedMock;
    const onPresentation = onPresentationMock;

    beforeAll(() => {
        initAllWRDependencies();
    });

    beforeEach(async () => {
        component = new WRTestComponent(
            activatedRoute,
            videoWebService,
            eventsService,
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
            roomClosingToastrService,
            clockService,
            consultationInvitiationService
        );

        const conference = new ConferenceResponse(Object.assign({}, globalConference));
        const participant = new ParticipantResponse(Object.assign({}, globalParticipant));
        component.hearing = new Hearing(conference);
        component.conference = conference;
        component.participant = participant;
        component.connected = true; // assume connected to pexip
        await component.setupPexipEventSubscriptionAndClient();
        videoWebService.getConferenceById.calls.reset();
        videoCallService.retrievePresentation.calls.reset();
        videoCallService.stopPresentation.calls.reset();
    });

    afterEach(() => {
        component.videoCallSubscription$.unsubscribe();
        if (component.callbackTimeout) {
            clearTimeout(component.callbackTimeout);
        }
    });

    it('should get token and connect to video call', fakeAsync(() => {
        videoCallService.makeCall.calls.reset();

        const eventsHubReadySubject = new Subject<any>();
        eventsServiceSpy.onEventsHubReady.and.returnValue(eventsHubReadySubject.asObservable());

        component.connectToPexip();
        flush();

        eventsHubReadySubject.next();
        flush();

        expect(videoCallService.makeCall).toHaveBeenCalled();
    }));

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

        spyOn(component, 'assignStream');
        const incomingStream = <any>{};
        const payload = new ConnectedCall(incomingStream);

        onConnectedSubject.next(payload);

        expect(component.stream).toBeDefined();
        expect(component.errorCount).toBe(0);
        expect(component.connected).toBeTruthy();
        expect(component.assignStream).toHaveBeenCalled();
    });

    it('should not define incoming stream when video call has connected but not stream if given', () => {
        spyOn(component, 'assignStream');
        const incomingStream = null;
        const payload = new ConnectedCall(incomingStream);

        onConnectedSubject.next(payload);

        expect(component.stream).toBeDefined();
        expect(component.errorCount).toBe(0);
        expect(component.connected).toBeTruthy();
        expect(component.assignStream).toHaveBeenCalledTimes(0);
    });

    it('should toggle video mute when call connects as a full video but camera is still muted', fakeAsync(() => {
        // arrange
        component.audioOnly = false;
        const controls = jasmine.createSpyObj<PrivateConsultationRoomControlsComponent>(
            'PrivateConsultationRoomControlsComponent',
            ['toggleVideoMute'],
            { videoMuted: true }
        );
        component.hearingControls = controls;

        const incomingStream = <any>{};
        const payload = new ConnectedCall(incomingStream);

        // act
        onConnectedSubject.next(payload);
        tick();

        // assert
        expect(controls.toggleVideoMute).toHaveBeenCalled();
    }));

    it('should hide video when video call failed', () => {
        const currentErrorCount = (component.errorCount = 0);
        const payload = new CallError('test failure intentional');

        onErrorSubject.next(payload);

        expect(component.connected).toBeFalsy();
        expect(component.errorCount).toBeGreaterThan(currentErrorCount);
        expect(component.showVideo).toBeFalsy();
        expect(errorService.handlePexipError).toHaveBeenCalledWith(payload, component.conference.id);
    });

    it('should hide video when video call has disconnected and attempt to connect again', () => {
        const payload = new DisconnectedCall('test failure intentional');

        onDisconnectedSubject.next(payload);

        expect(component.connected).toBeFalsy();
        expect(component.showVideo).toBeFalsy();
        expect(component.callbackTimeout).toBeDefined();
    });

    it('should stop reconnection on disconnect when hearing has been closed beyond 120 minutes', () => {
        const c = new ConferenceTestData().getConferenceDetailFuture();
        c.status = ConferenceStatus.Closed;
        const closedDateTime = new Date(new Date().toUTCString());
        closedDateTime.setUTCMinutes(closedDateTime.getUTCMinutes() - 120);
        c.closed_date_time = closedDateTime;
        component.hearing = new Hearing(c);
        component.conference = c;

        const payload = new DisconnectedCall('test failure intentional');

        onDisconnectedSubject.next(payload);

        expect(component.connected).toBeFalsy();
        expect(component.showVideo).toBeFalsy();
        expect(component.callbackTimeout).toBeUndefined();
    });

    it('should dettach current stream on transfer', () => {
        const incomingStream = <any>{};
        component.stream = incomingStream;
        onTransferSubject.next('new_room');
        expect(component.stream).toBeNull();
    });

    it('should retrieve presentation if started', () => {
        // Arrange
        const payload = new Presentation(true);

        // Act
        onPresentation.next(payload);

        // Assert
        expect(videoCallService.retrievePresentation).toHaveBeenCalledTimes(1);
    });

    it('should stop presentation if not started', () => {
        // Arrange
        const payload = new Presentation(false);

        // Act
        onPresentation.next(payload);

        // Assert
        expect(videoCallService.stopPresentation).toHaveBeenCalledTimes(1);
    });

    it('should set stream when connected', () => {
        // Arrange
        component.presentationStream = null;
        const stream = <any>{};
        const payload = new ConnectedPresentation(stream);

        // Act
        onPresentationConnected.next(payload);

        // Assert
        expect(component.presentationStream).toBe(stream);
    });

    it('should set stream to null when disconnected', () => {
        // Arrange
        component.presentationStream = <any>{};
        const payload = new DisconnectedPresentation('reason');

        // Act
        onPresentationDisconnected.next(payload);

        // Assert
        expect(component.presentationStream).toBe(null);
        expect(videoCallService.stopPresentation).toHaveBeenCalledTimes(1);
    });

    it('should switch stream windows', () => {
        // ToTrue
        component.streamInMain = false;
        component.switchStreamWindows();
        expect(component.streamInMain).toBeTrue();

        // ToFalse
        component.switchStreamWindows();
        expect(component.streamInMain).toBeFalse();
    });
});
