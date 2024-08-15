import { discardPeriodicTasks, fakeAsync, flush } from '@angular/core/testing';
import { Guid } from 'guid-typescript';
import { of, ReplaySubject, Subject } from 'rxjs';
import { ConfigService } from 'src/app/services/api/config.service';
import {
    ApiClient,
    ClientSettingsResponse,
    HearingLayout,
    SharedParticipantRoom,
    StartOrResumeVideoHearingRequest
} from 'src/app/services/clients/api-client';
import { HeartbeatService } from 'src/app/services/conference/heartbeat.service';
import { Logger } from 'src/app/services/logging/logger-base';
import { StreamMixerService } from 'src/app/services/stream-mixer.service';
import { UserMediaStreamService } from 'src/app/services/user-media-stream.service';
import { UserMediaService } from 'src/app/services/user-media.service';
import { getSpiedPropertyGetter } from 'src/app/shared/jasmine-helpers/property-helpers';
import { MediaDeviceTestData } from 'src/app/testing/mocks/data/media-device-test-data';
import { MockLogger } from 'src/app/testing/mocks/mock-logger';
import { ParticipantDeleted, ParticipantUpdated } from '../models/video-call-models';
import { mockCamStream, mockMicStream } from '../waiting-room-shared/tests/waiting-room-base-setup';
import { VideoCallEventsService } from './video-call-events.service';
import { VideoCallService } from './video-call.service';
import { MockStore, createMockStore } from '@ngrx/store/testing';
import { initialState as initialConferenceState, ConferenceState } from '../store/reducers/conference.reducer';

const config = new ClientSettingsResponse({
    supplier_turn_server: 'turnserver',
    supplier_turn_server_user: 'tester1',
    supplier_turn_server_credential: 'credential'
});

describe('VideoCallService', () => {
    let service: VideoCallService;
    let apiClient: jasmine.SpyObj<ApiClient>;
    const logger: Logger = new MockLogger();
    let userMediaService: jasmine.SpyObj<UserMediaService>;

    let userMediaStreamService: jasmine.SpyObj<UserMediaStreamService>;
    let currentStreamSubject: ReplaySubject<MediaStream>;
    let streamModifiedSubject: Subject<void>;
    let isAudioOnlySubject: ReplaySubject<boolean>;

    const testData = new MediaDeviceTestData();
    let pexipSpy: jasmine.SpyObj<PexipClient>;
    let configServiceSpy: jasmine.SpyObj<ConfigService>;
    let heartbeatServiceSpy: jasmine.SpyObj<HeartbeatService>;
    let videoCallEventsServiceSpy: jasmine.SpyObj<VideoCallEventsService>;
    let streamMixerServiceSpy: jasmine.SpyObj<StreamMixerService>;
    let mockStore: MockStore<ConferenceState>;

    beforeEach(fakeAsync(() => {
        const initialState = initialConferenceState;
        mockStore = createMockStore({ initialState });
        apiClient = jasmine.createSpyObj<ApiClient>('ApiClient', [
            'startOrResumeVideoHearing',
            'pauseVideoHearing',
            'suspendVideoHearing',
            'leaveHearing',
            'endVideoHearing',
            'callParticipant',
            'dismissParticipant',
            'getParticipantRoomForParticipant',
            'joinHearingInSession'
        ]);

        userMediaService = jasmine.createSpyObj<UserMediaService>(
            'UserMediaService',
            ['selectScreenToShare', 'initialise', 'checkCameraAndMicrophonePresence', 'updateStartWithAudioMuted'],
            ['connectedVideoDevices$', 'connectedMicrophoneDevices$', 'isAudioOnly$']
        );

        userMediaStreamService = jasmine.createSpyObj<UserMediaStreamService>(
            [],
            ['currentStream$', 'streamModified$', 'activeMicrophoneStream$']
        );
        currentStreamSubject = new ReplaySubject<MediaStream>(1);
        getSpiedPropertyGetter(userMediaStreamService, 'currentStream$').and.returnValue(currentStreamSubject.asObservable());
        streamModifiedSubject = new Subject<void>();
        isAudioOnlySubject = new ReplaySubject<boolean>(1);
        getSpiedPropertyGetter(userMediaStreamService, 'streamModified$').and.returnValue(streamModifiedSubject.asObservable());

        getSpiedPropertyGetter(userMediaService, 'connectedVideoDevices$').and.returnValue(of(testData.getListOfCameras()));
        getSpiedPropertyGetter(userMediaService, 'connectedMicrophoneDevices$').and.returnValue(of(testData.getListOfMicrophones()));
        getSpiedPropertyGetter(userMediaService, 'isAudioOnly$').and.returnValue(isAudioOnlySubject.asObservable());
        userMediaService.checkCameraAndMicrophonePresence.and.returnValue(Promise.resolve({ hasACamera: true, hasAMicrophone: true }));

        heartbeatServiceSpy = jasmine.createSpyObj<HeartbeatService>(['initialiseHeartbeat', 'stopHeartbeat']);

        configServiceSpy = jasmine.createSpyObj<ConfigService>('ConfigService', ['getConfig']);
        configServiceSpy.getConfig.and.returnValue(config);

        videoCallEventsServiceSpy = jasmine.createSpyObj<VideoCallEventsService>(['handleParticipantUpdated']);

        pexipSpy = jasmine.createSpyObj<PexipClient>('PexipClient', [
            'connect',
            'makeCall',
            'muteAudio',
            'muteVideo',
            'disconnect',
            'setBuzz',
            'clearBuzz',
            'setParticipantMute',
            'setMuteAllGuests',
            'clearAllBuzz',
            'setParticipantSpotlight',
            'disconnectCall',
            'addCall',
            'present',
            'getPresentation',
            'stopPresentation',
            'renegotiate',
            'dialOut',
            'disconnectParticipant',
            'setParticipantText',
            'transformLayout',
            'setParticipantText',
            'setSendToAudioMixes',
            'setReceiveFromAudioMix'
        ]);

        streamMixerServiceSpy = jasmine.createSpyObj<StreamMixerService>('StreamMixerService', ['mergeAudioStreams']);

        service = new VideoCallService(
            logger,
            userMediaService,
            userMediaStreamService,
            apiClient,
            configServiceSpy,
            heartbeatServiceSpy,
            videoCallEventsServiceSpy,
            streamMixerServiceSpy,
            mockStore
        );

        currentStreamSubject.next(mockCamStream);

        service.setupClient();
        flush();
    }));

    it('should initialise user_media_stream', () => {
        expect(service.pexipAPI.user_media_stream).toBe(mockCamStream);
    });

    it('should try to initialise the userMediaService', () => {
        expect(userMediaService.initialise).toHaveBeenCalledTimes(1);
    });

    it('should toggle mute', () => {
        pexipSpy.muteAudio.and.returnValue(true);
        service.pexipAPI = pexipSpy;
        const result = service.toggleMute('conference12', 'participant123');
        expect(result).toBeTruthy();
    });

    it('should toggle video', () => {
        pexipSpy.muteVideo.and.returnValue(true);
        service.pexipAPI = pexipSpy;
        const result = service.toggleVideo('conference12', 'participant123');
        expect(result).toBeTruthy();
    });

    it('should enable H264', () => {
        service.pexipAPI = pexipSpy;
        service.enableH264(true);
        expect(service.pexipAPI.h264_enabled).toBeTruthy();
    });

    it('should disable H264', () => {
        service.pexipAPI = pexipSpy;
        service.enableH264(false);
        expect(service.pexipAPI.h264_enabled).toBeFalsy();
    });

    it('should should connect to pexip node', () => {
        service.pexipAPI = pexipSpy;
        service.connect('', null);
        expect(pexipSpy.connect).toHaveBeenCalledWith('', null);
    });

    it('should disconnect from pexip when call is disconnected', () => {
        const setupClientSpy = spyOn(service, 'setupClient');

        service.pexipAPI = pexipSpy;
        service.disconnectFromCall();
        expect(pexipSpy.disconnect).toHaveBeenCalled();
        expect(heartbeatServiceSpy.stopHeartbeat).toHaveBeenCalledTimes(1);
        expect(setupClientSpy).toHaveBeenCalledTimes(1);
    });

    it('should not disconnect from pexip when api has not been initialised', () => {
        service.pexipAPI = null;
        expect(() => service.disconnectFromCall()).toThrowError('[VideoCallService] - Pexip Client has not been initialised.');
    });

    it('should call pexip with call details', async () => {
        const node = 'node124';
        const conferenceAlias = 'WR173674fff';
        const participantDisplayName = 'T1;John Doe';
        const maxBandwidth = 767;
        const callType: PexipCallType = null;
        service.pexipAPI = pexipSpy;

        await service.makeCall(node, conferenceAlias, participantDisplayName, maxBandwidth, null);
        expect(pexipSpy.makeCall).toHaveBeenCalledWith(node, conferenceAlias, participantDisplayName, maxBandwidth, callType);
        expect(pexipSpy.call_tag).toBeDefined();
    });

    it('should call pexip with as receive only when user does not have devices', async () => {
        const node = 'node124';
        const conferenceAlias = 'WR173674fff';
        const participantDisplayName = 'T1;John Doe';
        const maxBandwidth = 767;
        const callType: PexipCallType = 'recvonly';
        userMediaService.checkCameraAndMicrophonePresence.and.returnValue(Promise.resolve({ hasACamera: false, hasAMicrophone: false }));
        service.pexipAPI = pexipSpy;

        await service.makeCall(node, conferenceAlias, participantDisplayName, maxBandwidth, '12345');
        expect(pexipSpy.makeCall).toHaveBeenCalledWith(node, conferenceAlias, participantDisplayName, maxBandwidth, callType);
        expect(pexipSpy.call_tag).toBeDefined();
        expect(userMediaService.updateStartWithAudioMuted).toHaveBeenCalledWith('12345', true);
    });

    it('should call pexip as normal when user has a microphone only', async () => {
        const node = 'node124';
        const conferenceAlias = 'WR173674fff';
        const participantDisplayName = 'T1;John Doe';
        const maxBandwidth = 767;
        const callType: PexipCallType = null;
        userMediaService.checkCameraAndMicrophonePresence.and.returnValue(Promise.resolve({ hasACamera: false, hasAMicrophone: true }));
        service.pexipAPI = pexipSpy;

        await service.makeCall(node, conferenceAlias, participantDisplayName, maxBandwidth, '12345');
        expect(pexipSpy.makeCall).toHaveBeenCalledWith(node, conferenceAlias, participantDisplayName, maxBandwidth, callType);
        expect(pexipSpy.call_tag).toBeDefined();
    });

    it('should init the call tag', () => {
        service.pexipAPI.call_tag = null;
        service.initCallTag();
        expect(service.pexipAPI.call_tag).toBeDefined();
    });

    it('should set buzz when hand is raised', () => {
        service.pexipAPI = pexipSpy;
        service.raiseHand('conference12', 'participant123');
        expect(pexipSpy.setBuzz).toHaveBeenCalledTimes(1);
    });

    it('should clear buzz when hand is lowered', () => {
        service.pexipAPI = pexipSpy;
        service.lowerHand('conference12', 'participant123');
        expect(pexipSpy.clearBuzz).toHaveBeenCalledTimes(1);
    });
    it('should clear buzz when hand is lowered for participant uuid', () => {
        service.pexipAPI = pexipSpy;
        const uuid = '12345';
        service.lowerHandById(uuid, 'conference12', 'participant123');
        expect(pexipSpy.clearBuzz).toHaveBeenCalledWith(uuid);
    });
    it('should clear all buzz when hand is lowered for all participants', () => {
        service.pexipAPI = pexipSpy;
        service.lowerAllHands('conference12');
        expect(pexipSpy.clearAllBuzz).toHaveBeenCalledTimes(1);
    });
    it('should make api start call on start hearing', async () => {
        apiClient.startOrResumeVideoHearing.and.returnValue(of());
        const conferenceId = Guid.create().toString();
        const layout = HearingLayout.TwoPlus21;
        await service.startHearing(conferenceId, layout);
        expect(apiClient.startOrResumeVideoHearing).toHaveBeenCalledWith(conferenceId, new StartOrResumeVideoHearingRequest({ layout }));
    });

    it('should make api pause call on pause hearing', async () => {
        apiClient.pauseVideoHearing.and.returnValue(of());
        const conferenceId = Guid.create().toString();
        await service.pauseHearing(conferenceId);
        expect(apiClient.pauseVideoHearing).toHaveBeenCalledWith(conferenceId);
    });

    it('should make api call to suspend hearing', async () => {
        apiClient.suspendVideoHearing.and.returnValue(of());
        const conferenceId = Guid.create().toString();
        await service.suspendHearing(conferenceId);
        expect(apiClient.suspendVideoHearing).toHaveBeenCalledWith(conferenceId);
    });

    it('should make api call to leave hearing', async () => {
        apiClient.leaveHearing.and.returnValue(of());
        const conferenceId = Guid.create().toString();
        const participantId = Guid.create().toString();
        await service.leaveHearing(conferenceId, participantId);
        expect(apiClient.leaveHearing).toHaveBeenCalledWith(conferenceId, participantId);
    });

    it('should make api end call on end hearing', async () => {
        apiClient.endVideoHearing.and.returnValue(of());
        const conferenceId = Guid.create().toString();
        await service.endHearing(conferenceId);
        expect(apiClient.endVideoHearing).toHaveBeenCalledWith(conferenceId);
    });

    it('should make api call witness on call witness', async () => {
        apiClient.callParticipant.and.returnValue(of());
        const conferenceId = Guid.create().toString();
        const witnessId = Guid.create().toString();
        await service.callParticipantIntoHearing(conferenceId, witnessId);
        expect(apiClient.callParticipant).toHaveBeenCalledWith(conferenceId, witnessId);
    });

    it('makes api to join a video hearing currently in session', async () => {
        apiClient.joinHearingInSession.and.returnValue(of());
        const conferenceId = Guid.create().toString();
        const witnessId = Guid.create().toString();
        await service.joinHearingInSession(conferenceId, witnessId);
        expect(apiClient.joinHearingInSession).toHaveBeenCalledWith(conferenceId, witnessId);
    });

    it('should make api dismiss witness on dismiss witness', async () => {
        apiClient.dismissParticipant.and.returnValue(of());
        const conferenceId = Guid.create().toString();
        const witnessId = Guid.create().toString();
        await service.dismissParticipantFromHearing(conferenceId, witnessId);
        expect(apiClient.dismissParticipant).toHaveBeenCalledWith(conferenceId, witnessId);
    });

    it('should call renegotiate', () => {
        service.pexipAPI = pexipSpy;

        service.renegotiateCall();

        expect(pexipSpy.renegotiate).toHaveBeenCalled();
    });

    it('should select stream and set user_presentation_stream', async () => {
        // Arrange
        const stream = <any>{};
        service.pexipAPI = pexipSpy;
        service.pexipAPI.user_presentation_stream = null;
        userMediaService.selectScreenToShare.and.returnValue(stream);

        // Act
        await service.selectScreen();

        // Assert
        expect(pexipSpy.user_presentation_stream).toBe(stream);
    });

    it('should call present when starting screen share', async () => {
        // Arrange
        service.pexipAPI = pexipSpy;

        // Act
        await service.startScreenShare();

        // Assert
        expect(pexipSpy.present).toHaveBeenCalledWith('screen');
    });

    it('should call present null when stopping screen share', async () => {
        // Arrange
        service.pexipAPI = pexipSpy;

        // Act
        await service.stopScreenShare();

        // Assert
        expect(pexipSpy.present).toHaveBeenCalledWith(null);
    });

    it('should call retrieve presentaion', async () => {
        // Arrange
        service.pexipAPI = pexipSpy;

        // Act
        await service.retrievePresentation();

        // Assert
        expect(pexipSpy.getPresentation).toHaveBeenCalledTimes(1);
    });

    it('should call stop presentaion', async () => {
        // Arrange
        service.pexipAPI = pexipSpy;

        // Act
        await service.stopPresentation();

        // Assert
        expect(pexipSpy.stopPresentation).toHaveBeenCalledTimes(1);
    });

    it('should call api to get interpreter room', async () => {
        const conferenceId = Guid.create().toString();
        const participantId = Guid.create().toString();
        apiClient.getParticipantRoomForParticipant.and.returnValue(of(new SharedParticipantRoom({ display_name: 'Interpreter1' })));

        await service.retrieveInterpreterRoom(conferenceId, participantId);

        expect(apiClient.getParticipantRoomForParticipant).toHaveBeenCalledWith(conferenceId, participantId, 'Civilian');
    });

    it('should call api to get interpreter room with participant type witness', async () => {
        const conferenceId = Guid.create().toString();
        const participantId = Guid.create().toString();
        apiClient.getParticipantRoomForParticipant.and.returnValue(of(new SharedParticipantRoom({ display_name: 'Interpreter1' })));
        await service.retrieveWitnessInterpreterRoom(conferenceId, participantId);

        expect(apiClient.getParticipantRoomForParticipant).toHaveBeenCalledWith(conferenceId, participantId, 'Witness');
    });

    it('should call api to get judicial room with participant type judicial', async () => {
        const conferenceId = Guid.create().toString();
        const participantId = Guid.create().toString();
        apiClient.getParticipantRoomForParticipant.and.returnValue(of(new SharedParticipantRoom({ display_name: 'PanelMember1' })));
        await service.retrieveJudicialRoom(conferenceId, participantId);

        expect(apiClient.getParticipantRoomForParticipant).toHaveBeenCalledWith(conferenceId, participantId, 'Judicial');
    });

    describe('PexipAPI onConnect', () => {
        it('should call renegotiateCall', fakeAsync(() => {
            spyOn<any>(service, 'renegotiateCall').and.callThrough();
            service.pexipAPI.onConnect(mockCamStream);
            flush();
            streamModifiedSubject.next();
            flush();
            discardPeriodicTasks();
            expect(service['renegotiateCall']).toHaveBeenCalled();
        }));
    });

    describe('SetupClient', () => {
        it('should init pexip and set pexip client', async () => {
            await service.setupClient();
            expect(service.pexipAPI).toBeDefined();
            expect(service.onCallSetup()).toBeDefined();
            expect(service.onCallConnected()).toBeDefined();
            expect(service.onCallDisconnected()).toBeDefined();
            expect(service.onError()).toBeDefined();
            expect(service.onParticipantUpdated()).toBeDefined();
            expect(service.onConferenceUpdated()).toBeDefined();
            expect(service.onParticipantDeleted()).toBeDefined();
            expect(service.onCallTransferred()).toBeDefined();
            expect(service.onPresentation()).toBeDefined();
            expect(service.onPresentationConnected()).toBeDefined();
            expect(service.onPresentationDisconnected()).toBeDefined();
            expect(service.onScreenshareConnected()).toBeDefined();
            expect(service.onScreenshareStopped()).toBeDefined();
            expect(service.onVideoEvidenceShared()).toBeDefined();
            expect(service.onVideoEvidenceStopped()).toBeDefined();
            expect(service.pexipAPI.turn_server).toBeDefined();
            expect(service.pexipAPI.turn_server.urls).toContain(config.supplier_turn_server);
            expect(service.pexipAPI.turn_server.username).toContain(config.supplier_turn_server_user);
            expect(service.pexipAPI.turn_server.credential).toContain(config.supplier_turn_server_credential);
        });

        it('should setup the client again when an error occurs', () => {
            // Arrange
            const setupClientSpy = spyOn(service, 'setupClient');
            // Act
            service.pexipAPI.onError('reason');

            // Assert
            expect(setupClientSpy).toHaveBeenCalledTimes(1);
        });

        it('should setup the client again when a server disconnect occurs', () => {
            // Arrange
            const setupClientSpy = spyOn(service, 'setupClient');
            // Act
            service.pexipAPI.onDisconnect('reason');

            // Assert
            expect(setupClientSpy).toHaveBeenCalledTimes(1);
        });

        it('should update user_media_stream', fakeAsync(() => {
            service.pexipAPI.user_media_stream = mockMicStream;
            service.setupClient();
            currentStreamSubject.next(mockCamStream);
            flush();
            expect(service.pexipAPI.user_media_stream).toEqual(mockCamStream);
        }));

        it('should call renegotiateCall', fakeAsync(() => {
            spyOn<any>(service, 'renegotiateCall').and.callThrough();
            service.pexipAPI.user_media_stream = mockMicStream;

            service.setupClient();
            currentStreamSubject.next(mockCamStream);
            currentStreamSubject.next(mockCamStream);
            service.pexipAPI.user_media_stream = mockMicStream;
            currentStreamSubject.next(mockCamStream);
            flush();
            discardPeriodicTasks();
            expect(service['renegotiateCall']).toHaveBeenCalled();
        }));
    });

    describe('handleParticipantCreated', () => {
        it('should raise the event through the video call events service', fakeAsync(() => {
            // Arrange
            const pexipParticipant: PexipParticipant = {
                buzz_time: 0,
                is_muted: 'is_muted',
                display_name: 'display_name',
                local_alias: 'local_alias',
                start_time: 0,
                uuid: 'uuid',
                spotlight: 0,
                mute_supported: 'mute_supported',
                is_external: false,
                external_node_uuid: 'external_node_uuid',
                has_media: false,
                call_tag: 'call_tag',
                is_audio_only_call: 'is_audio_only_call',
                is_video_call: 'is_video_call',
                protocol: 'protocol',
                disconnect_supported: 'Yes',
                transfer_supported: 'Yes',
                is_main_video_dropped_out: false,
                is_video_muted: false,
                is_streaming_conference: false,
                send_to_audio_mixes: [{ mix_name: 'main', prominent: false }],
                receive_from_audio_mix: 'main'
            };

            const expectedUpdate = ParticipantUpdated.fromPexipParticipant(pexipParticipant);

            // Act
            let result: ParticipantUpdated | null = null;
            service.onParticipantCreated().subscribe(update => (result = update));

            service.pexipAPI.onParticipantCreate(pexipParticipant);
            flush();

            // Assert
            expect(result).toBeTruthy();
            expect(result).toEqual(expectedUpdate);
        }));

        it('should not raise the event through video event service if the participant is undefined', fakeAsync(() => {
            // Arrange
            const pexipParticipant: PexipParticipant = {
                buzz_time: 0,
                is_muted: undefined,
                display_name: undefined,
                local_alias: undefined,
                start_time: 0,
                uuid: undefined,
                spotlight: 0,
                mute_supported: undefined,
                is_external: false,
                external_node_uuid: undefined,
                has_media: false,
                call_tag: undefined,
                is_audio_only_call: undefined,
                is_video_call: undefined,
                protocol: undefined,
                disconnect_supported: undefined,
                transfer_supported: undefined,
                is_main_video_dropped_out: undefined,
                is_video_muted: undefined,
                is_streaming_conference: undefined,
                send_to_audio_mixes: undefined,
                receive_from_audio_mix: undefined
            };

            // Act
            let result: ParticipantUpdated | null = null;
            service.onParticipantCreated().subscribe(update => (result = update));

            service.pexipAPI.onParticipantCreate(pexipParticipant);
            flush();

            // Assert
            expect(result).toBeNull();
        }));
    });

    describe('handleParticipantUpdate', () => {
        it('should raise the event through video call events service', fakeAsync(() => {
            // Arrange
            const pexipParticipant: PexipParticipant = {
                buzz_time: 0,
                is_muted: 'is_muted',
                display_name: 'display_name',
                local_alias: 'local_alias',
                start_time: 0,
                uuid: 'uuid',
                spotlight: 0,
                mute_supported: 'mute_supported',
                is_external: false,
                external_node_uuid: 'external_node_uuid',
                has_media: false,
                call_tag: 'call_tag',
                is_audio_only_call: 'is_audio_only_call',
                is_video_call: 'is_video_call',
                protocol: 'protocol',
                disconnect_supported: 'Yes',
                transfer_supported: 'Yes',
                is_main_video_dropped_out: false,
                is_video_muted: false,
                is_streaming_conference: false,
                send_to_audio_mixes: [{ mix_name: 'main', prominent: false }],
                receive_from_audio_mix: 'main'
            };

            const expectedUpdate = ParticipantUpdated.fromPexipParticipant(pexipParticipant);

            // Act
            let result: ParticipantUpdated | null = null;
            service.onParticipantUpdated().subscribe(update => (result = update));

            service.pexipAPI.onParticipantUpdate(pexipParticipant);
            flush();

            // Assert
            expect(result).toBeTruthy();
            expect(result).toEqual(expectedUpdate);
            expect(videoCallEventsServiceSpy.handleParticipantUpdated).toHaveBeenCalledOnceWith(expectedUpdate);
        }));

        it('should not raise the event through video event service if the participant is undefined', fakeAsync(() => {
            // Arrange
            const pexipParticipant: PexipParticipant = {
                buzz_time: 0,
                is_muted: undefined,
                display_name: undefined,
                local_alias: undefined,
                start_time: 0,
                uuid: undefined,
                spotlight: 0,
                mute_supported: undefined,
                is_external: false,
                external_node_uuid: undefined,
                has_media: false,
                call_tag: undefined,
                is_audio_only_call: undefined,
                is_video_call: undefined,
                protocol: undefined,
                disconnect_supported: undefined,
                transfer_supported: undefined,
                is_main_video_dropped_out: undefined,
                is_video_muted: undefined,
                is_streaming_conference: undefined,
                send_to_audio_mixes: undefined,
                receive_from_audio_mix: undefined
            };

            // Act
            let result: ParticipantUpdated | null = null;
            service.onParticipantUpdated().subscribe(update => (result = update));

            service.pexipAPI.onParticipantUpdate(pexipParticipant);
            flush();

            // Assert
            expect(result).toBeNull();
            expect(videoCallEventsServiceSpy.handleParticipantUpdated).not.toHaveBeenCalled();
        }));
    });

    describe('handleParticipantDelete', () => {
        it('should push the deleted participant subject from pexip into the service onParticipantDeleted observable', fakeAsync(() => {
            // Arrange
            const participant = { uuid: 'uuid' };
            // Act
            let result: ParticipantDeleted | null = null;
            service.onParticipantDeleted().subscribe(update => (result = update));

            service.pexipAPI.onParticipantDelete(participant);
            flush();

            // Assert
            expect(result).toBeTruthy();
            expect(result.uuid).toEqual(participant.uuid);
        }));
    });

    describe('start dynamic evidence sharing', () => {
        let screenStream: jasmine.SpyObj<MediaStream>;
        let screenVideoTrack: jasmine.SpyObj<MediaStreamTrack>;
        let screenAudioTrack: jasmine.SpyObj<MediaStreamTrack>;

        let micStream: jasmine.SpyObj<MediaStream>;
        let micAudioTrack: jasmine.SpyObj<MediaStreamTrack>;

        let activeMicrophoneStreamSubject: ReplaySubject<MediaStream>;

        let mergedStream: jasmine.SpyObj<MediaStream>;
        let mergedAudioTrack: jasmine.SpyObj<MediaStreamTrack>;

        beforeEach(() => {
            micStream = jasmine.createSpyObj<MediaStream>('MediaStream', [
                'addTrack',
                'removeTrack',
                'getTracks',
                'getVideoTracks',
                'getAudioTracks'
            ]);
            micAudioTrack = jasmine.createSpyObj<MediaStreamTrack>('MediaStreamTrack', ['stop'], ['label', 'id']);
            getSpiedPropertyGetter(micAudioTrack, 'label').and.returnValue('micAudioTrack');
            micStream.getAudioTracks.and.returnValue([micAudioTrack]);
            micStream.getTracks.and.returnValue([micAudioTrack]);

            activeMicrophoneStreamSubject = new ReplaySubject<MediaStream>(1);
            getSpiedPropertyGetter(userMediaStreamService, 'activeMicrophoneStream$').and.returnValue(
                activeMicrophoneStreamSubject.asObservable()
            );
            activeMicrophoneStreamSubject.next(micStream);

            screenStream = jasmine.createSpyObj<MediaStream>('MediaStream', [
                'addTrack',
                'removeTrack',
                'getTracks',
                'getVideoTracks',
                'getAudioTracks'
            ]);
            screenVideoTrack = jasmine.createSpyObj<MediaStreamTrack>('MediaStreamTrack', ['stop', 'addEventListener'], ['label', 'id']);
            screenVideoTrack.addEventListener.and.callThrough();
            screenAudioTrack = jasmine.createSpyObj<MediaStreamTrack>('MediaStreamTrack', ['stop'], ['label', 'id']);

            getSpiedPropertyGetter(screenAudioTrack, 'label').and.returnValue('screenAudioTrack');
            getSpiedPropertyGetter(screenVideoTrack, 'label').and.returnValue('screenVideoTrack');
            getSpiedPropertyGetter(screenVideoTrack, 'id').and.returnValue(Guid.create().toString());

            screenStream.getTracks.and.returnValue([screenVideoTrack, screenAudioTrack]);
            screenStream.getVideoTracks.and.returnValue([screenVideoTrack]);
            screenStream.getAudioTracks.and.returnValue([screenAudioTrack]);

            mergedAudioTrack = jasmine.createSpyObj<MediaStreamTrack>('MediaStreamTrack', ['stop'], ['label', 'id']);
            getSpiedPropertyGetter(mergedAudioTrack, 'label').and.returnValue('mergedAudioTrack');
            mergedStream = jasmine.createSpyObj<MediaStream>('MediaStream', [
                'addTrack',
                'removeTrack',
                'getTracks',
                'getVideoTracks',
                'getAudioTracks'
            ]);
            mergedStream.getAudioTracks.and.returnValue([mergedAudioTrack]);
            mergedStream.getTracks.and.returnValue([mergedAudioTrack]);
            mergedStream.getVideoTracks.and.returnValue([screenVideoTrack]);

            streamMixerServiceSpy.mergeAudioStreams.and.returnValue(mergedStream);
            userMediaService.selectScreenToShare.and.returnValue(Promise.resolve(screenStream));
        });

        it('should replace pexip media stream with screen and mic stream', fakeAsync(async () => {
            spyOn<any>(service, 'renegotiateCall').and.callThrough();
            service.pexipAPI.user_media_stream = screenStream;

            await service.selectScreenWithMicrophone();

            flush();

            expect(service['renegotiateCall']).toHaveBeenCalled();
            expect(service.pexipAPI.user_media_stream).not.toBe(mockCamStream);
        }));
    });

    describe('stop dynamic evidence sharing', () => {
        let screenStream: jasmine.SpyObj<MediaStream>;
        let videoTrack: jasmine.SpyObj<MediaStreamTrack>;
        let audioTrack: jasmine.SpyObj<MediaStreamTrack>;

        beforeEach(() => {
            screenStream = jasmine.createSpyObj<MediaStream>(['addTrack', 'removeTrack', 'getTracks', 'getVideoTracks', 'getAudioTracks']);
            videoTrack = jasmine.createSpyObj<MediaStreamTrack>(['stop'], ['label', 'id']);
            audioTrack = jasmine.createSpyObj<MediaStreamTrack>(['stop'], ['label', 'id']);

            getSpiedPropertyGetter(videoTrack, 'label').and.returnValue(Guid.create().toString());
            getSpiedPropertyGetter(videoTrack, 'id').and.returnValue(Guid.create().toString());

            screenStream.getTracks.and.returnValue([videoTrack, audioTrack]);
            screenStream.getVideoTracks.and.returnValue([videoTrack]);
            screenStream.getAudioTracks.and.returnValue([audioTrack]);
        });

        it('should replace pexip media stream with original user stream', fakeAsync(() => {
            spyOn<any>(service, 'renegotiateCall').and.callThrough();
            service.pexipAPI.user_media_stream = screenStream;
            service['_displayStream'] = screenStream;

            service.stopScreenWithMicrophone();

            flush();
            discardPeriodicTasks();

            expect(service['renegotiateCall']).toHaveBeenCalled();
            expect(service.pexipAPI.user_media_stream).not.toEqual(screenStream);
            expect(service.pexipAPI.user_media_stream).toEqual(mockCamStream);
        }));
    });

    describe('Wowza Listener connection', () => {
        it('Reconnect wowza agent via Dialout pexip function', () => {
            service.pexipAPI = pexipSpy;
            const ingestUrl = 'ingestUrl';
            service.connectWowzaAgent(ingestUrl, null);
            expect(pexipSpy.dialOut).toHaveBeenCalledOnceWith(ingestUrl, 'auto', 'GUEST', null, jasmine.any(Object));
        });

        it('Disconnect wowza agent via pexip Participant Delete function', () => {
            service.pexipAPI = pexipSpy;
            const uuid = 'uuid';
            service.disconnectWowzaAgent(uuid);
            expect(pexipSpy.disconnectParticipant).toHaveBeenCalledOnceWith(uuid);
        });
    });

    describe('setParticipantOverlayText', () => {
        it('should call pexip setParticipantOverlayText', () => {
            service.pexipAPI = pexipSpy;
            const uuid = 'uuid';
            const text = 'text';
            service.setParticipantOverlayText(uuid, text);
            expect(pexipSpy.setParticipantText).toHaveBeenCalledWith(uuid, text);
        });
    });

    describe('transformLayout', () => {
        it('should return the correct layout for a given hearing layout', () => {
            service.pexipAPI = pexipSpy;
            const layout = HearingLayout.TwoPlus21;
            service.transformLayout(layout);
            expect(pexipSpy.transformLayout).toHaveBeenCalledOnceWith({ layout: layout });
        });
    });

    describe('sendParticipantAudioToMixes', () => {
        it('should call pexip sendParticipantAudioToMixes', () => {
            service.pexipAPI = pexipSpy;
            const uuid = 'uuid';
            const mixes = [{ mix_name: 'main', prominent: false }];
            service.sendParticipantAudioToMixes(mixes, uuid);
            expect(pexipSpy.setSendToAudioMixes).toHaveBeenCalledWith(mixes, uuid);
        });
    });

    describe('receiveAudioFromMix', () => {
        it('should call pexip receiveAudioFromMix', () => {
            service.pexipAPI = pexipSpy;
            const uuid = 'uuid';
            const mixName = 'main';
            service.receiveAudioFromMix(mixName, uuid);
            expect(pexipSpy.setReceiveFromAudioMix).toHaveBeenCalledWith(mixName, uuid);
        });
    });
});
