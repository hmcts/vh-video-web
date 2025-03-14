import { fakeAsync, flush, tick } from '@angular/core/testing';
import { Guid } from 'guid-typescript';
import { of, Subject } from 'rxjs';
import { ConferenceResponse, ConferenceStatus, ParticipantResponse } from 'src/app/services/clients/api-client';
import { Hearing } from 'src/app/shared/models/hearing';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { eventsServiceSpy } from 'src/app/testing/mocks/mock-events-service';
import {
    onSetupSubjectMock,
    onConnectedSubjectMock,
    onDisconnectedSubjectMock,
    onErrorSubjectMock,
    onCallTransferredMock,
    onPresentationConnectedMock,
    onPresentationDisconnectedMock,
    onPresentationMock,
    onParticipantUpdatedMock
} from 'src/app/testing/mocks/mock-video-call.service';
import {
    CallSetup,
    ConnectedCall,
    CallError,
    DisconnectedCall,
    Presentation,
    ConnectedPresentation,
    DisconnectedPresentation,
    ParticipantUpdated
} from '../../models/video-call-models';
import { PrivateConsultationRoomControlsComponent } from '../../private-consultation-room-controls/private-consultation-room-controls.component';
import { createParticipantRemoteMuteStoreServiceSpy } from '../../services/mock-participant-remote-mute-store.service';
import {
    activatedRoute,
    clockService,
    consultationInvitiationService,
    consultationService,
    deviceTypeService,
    errorService,
    eventsService,
    focusService,
    globalConference,
    globalParticipant,
    hideComponentsService,
    initAllWRDependencies,
    logger,
    mockConferenceStore,
    notificationSoundsService,
    notificationToastrService,
    roomClosingToastrService,
    router,
    titleService,
    videoCallService,
    launchDarklyService,
    videoWebService
} from './waiting-room-base-setup';
import { WRTestComponent } from './WRTestComponent';
import { FEATURE_FLAGS } from 'src/app/services/launch-darkly.service';

describe('WaitingRoomComponent Video Call', () => {
    let component: WRTestComponent;

    const onSetupSubject = onSetupSubjectMock;
    const onConnectedSubject = onConnectedSubjectMock;
    const onDisconnectedSubject = onDisconnectedSubjectMock;
    const onErrorSubject = onErrorSubjectMock;
    const onTransferSubject = onCallTransferredMock;
    const onPresentationConnected = onPresentationConnectedMock;
    const onPresentationDisconnected = onPresentationDisconnectedMock;
    const onPresentation = onPresentationMock;

    let participantRemoteMuteStoreServiceSpy = createParticipantRemoteMuteStoreServiceSpy();

    beforeEach(async () => {
        participantRemoteMuteStoreServiceSpy = createParticipantRemoteMuteStoreServiceSpy();

        initAllWRDependencies();

        launchDarklyService.getFlag.withArgs(FEATURE_FLAGS.instantMessaging, false).and.returnValue(of(true));
        launchDarklyService.getFlag.and.returnValue(of(true));

        component = new WRTestComponent(
            activatedRoute,
            videoWebService,
            eventsService,
            logger,
            errorService,
            videoCallService,
            deviceTypeService,
            router,
            consultationService,
            notificationSoundsService,
            notificationToastrService,
            roomClosingToastrService,
            clockService,
            consultationInvitiationService,
            participantRemoteMuteStoreServiceSpy,
            titleService,
            hideComponentsService,
            focusService,
            launchDarklyService,
            mockConferenceStore
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

        mockConferenceStore.resetSelectors();
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

    it('should listen for participant updates event and update the remote mute status service', fakeAsync(() => {
        // Arrange
        const participantId = Guid.create().toString();
        const isMuted = true;

        // Act
        onParticipantUpdatedMock.next(
            ParticipantUpdated.fromPexipParticipant({
                buzz_time: 0,
                call_tag: null,
                display_name: `ROLE;NO_HEARBEAT;NAME;${participantId}`,
                external_node_uuid: '',
                has_media: true,
                is_audio_only_call: '',
                is_external: false,
                is_muted: isMuted ? 'YES' : 'NO',
                is_video_call: 'true',
                local_alias: '',
                mute_supported: 'true',
                protocol: '',
                role: 'GUEST',
                is_video_silent: false,
                spotlight: 0,
                start_time: 0,
                uuid: '',
                disconnect_supported: 'Yes',
                transfer_supported: 'Yes',
                is_main_video_dropped_out: false,
                is_video_muted: false,
                is_streaming_conference: false,
                send_to_audio_mixes: [{ mix_name: 'main', prominent: false }],
                receive_from_audio_mix: 'main'
            })
        );
        flush();

        // Assert
        expect(participantRemoteMuteStoreServiceSpy.updateRemoteMuteStatus).toHaveBeenCalledOnceWith(participantId, isMuted);
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
        component.callStream = incomingStream;
        onTransferSubject.next('new_room');
        expect(component.callStream).toBeNull();
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
