<<<<<<< HEAD
import { fakeAsync, flush } from '@angular/core/testing';
=======
import { discardPeriodicTasks, fakeAsync, flush } from '@angular/core/testing';
>>>>>>> origin
import { Guid } from 'guid-typescript';
import { of, ReplaySubject, Subject } from 'rxjs';
import { ConfigService } from 'src/app/services/api/config.service';
import {
    ApiClient,
    ClientSettingsResponse,
    HearingLayout,
    SharedParticipantRoom,
    StartHearingRequest
} from 'src/app/services/clients/api-client';
import { KinlyHeartbeatService } from 'src/app/services/conference/kinly-heartbeat.service';
import { Logger } from 'src/app/services/logging/logger-base';
import { SessionStorage } from 'src/app/services/session-storage';
import { UserMediaStreamService } from 'src/app/services/user-media-stream.service';
import { UserMediaService } from 'src/app/services/user-media.service';
import { getSpiedPropertyGetter } from 'src/app/shared/jasmine-helpers/property-helpers';
import { MediaDeviceTestData } from 'src/app/testing/mocks/data/media-device-test-data';
import { MockLogger } from 'src/app/testing/mocks/mock-logger';
<<<<<<< HEAD
import { ParticipantUpdated } from '../models/video-call-models';
import { VideoCallEventsService } from './video-call-events.service';
import { VideoCallPreferences } from './video-call-preferences.mode';
=======
import { mockCamStream, mockMicStream } from '../waiting-room-shared/tests/waiting-room-base-setup';
import { ParticipantUpdated } from '../models/video-call-models';
import { VideoCallEventsService } from './video-call-events.service';
>>>>>>> origin
import { VideoCallService } from './video-call.service';

const config = new ClientSettingsResponse({
    kinly_turn_server: 'turnserver',
    kinly_turn_server_user: 'tester1',
    kinly_turn_server_credential: 'credential'
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
    let kinlyHeartbeatServiceSpy: jasmine.SpyObj<KinlyHeartbeatService>;
    let videoCallEventsServiceSpy: jasmine.SpyObj<VideoCallEventsService>;
<<<<<<< HEAD
    beforeAll(() => {
=======

    beforeEach(fakeAsync(() => {
>>>>>>> origin
        apiClient = jasmine.createSpyObj<ApiClient>('ApiClient', [
            'startOrResumeVideoHearing',
            'pauseVideoHearing',
            'endVideoHearing',
            'callParticipant',
            'dismissParticipant',
            'getParticipantRoomForParticipant'
        ]);

        userMediaService = jasmine.createSpyObj<UserMediaService>(
            'UserMediaService',
            ['selectScreenToShare', 'initialise'],
            ['connectedVideoDevices$', 'connectedMicrophoneDevices$', 'isAudioOnly$']
        );

        userMediaStreamService = jasmine.createSpyObj<UserMediaStreamService>([], ['currentStream$', 'streamModified$']);
        currentStreamSubject = new ReplaySubject<MediaStream>(1);
        getSpiedPropertyGetter(userMediaStreamService, 'currentStream$').and.returnValue(currentStreamSubject.asObservable());
        streamModifiedSubject = new Subject<void>();
        isAudioOnlySubject = new ReplaySubject<boolean>(1);
        getSpiedPropertyGetter(userMediaStreamService, 'streamModified$').and.returnValue(streamModifiedSubject.asObservable());

        getSpiedPropertyGetter(userMediaService, 'connectedVideoDevices$').and.returnValue(of(testData.getListOfCameras()));
        getSpiedPropertyGetter(userMediaService, 'connectedMicrophoneDevices$').and.returnValue(of(testData.getListOfMicrophones()));
        getSpiedPropertyGetter(userMediaService, 'isAudioOnly$').and.returnValue(isAudioOnlySubject.asObservable());

        kinlyHeartbeatServiceSpy = jasmine.createSpyObj<KinlyHeartbeatService>(['initialiseHeartbeat', 'stopHeartbeat']);

        configServiceSpy = jasmine.createSpyObj<ConfigService>('ConfigService', ['getConfig']);
        configServiceSpy.getConfig.and.returnValue(config);

        videoCallEventsServiceSpy = jasmine.createSpyObj<VideoCallEventsService>(['handleParticipantUpdated']);

<<<<<<< HEAD
    beforeEach(async () => {
        kinlyHeartbeatServiceSpy = jasmine.createSpyObj<KinlyHeartbeatService>(['initialiseHeartbeat', 'stopHeartbeat']);
        videoCallEventsServiceSpy = jasmine.createSpyObj<VideoCallEventsService>(['handleParticipantUpdated']);

=======
>>>>>>> origin
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
            'renegotiate'
        ]);
<<<<<<< HEAD
        service = new VideoCallService(
            logger,
            userMediaService,
=======

        service = new VideoCallService(
            logger,
            userMediaService,
            userMediaStreamService,
>>>>>>> origin
            apiClient,
            configServiceSpy,
            kinlyHeartbeatServiceSpy,
            videoCallEventsServiceSpy
        );
<<<<<<< HEAD
        await service.setupClient();
    });

    it('should init pexip and set pexip client', async () => {
        await service.setupClient();
        expect(service.pexipAPI).toBeDefined();
        expect(userMediaService.getPreferredCamera).toBeDefined();
        expect(userMediaService.getPreferredMicrophone).toBeDefined();
        expect(service.pexipAPI.audio_source).toEqual(preferredMicrophone.deviceId);
        expect(service.pexipAPI.video_source).toEqual(preferredCamera.deviceId);

        expect(service.onCallSetup()).toBeDefined();
        expect(service.onCallConnected()).toBeDefined();
        expect(service.onCallDisconnected()).toBeDefined();
        expect(service.onError()).toBeDefined();
        expect(service.onParticipantUpdated()).toBeDefined();
        expect(service.onConferenceUpdated()).toBeDefined();
        expect(service.onCallTransferred()).toBeDefined();
        expect(service.onPresentation()).toBeDefined();
        expect(service.onPresentationConnected()).toBeDefined();
        expect(service.onPresentationDisconnected()).toBeDefined();
        expect(service.onScreenshareConnected()).toBeDefined();
        expect(service.onScreenshareStopped()).toBeDefined();
        expect(service.pexipAPI.turn_server).toBeDefined();
        expect(service.pexipAPI.turn_server.url).toContain(config.kinly_turn_server);
        expect(service.pexipAPI.turn_server.username).toContain(config.kinly_turn_server_user);
        expect(service.pexipAPI.turn_server.credential).toContain(config.kinly_turn_server_credential);
    });

    it('should use default devices on setup if no preferred devices found', async () => {
        userMediaService.getPreferredCamera.and.resolveTo(null);
        userMediaService.getPreferredMicrophone.and.resolveTo(null);

        await service.setupClient();

        expect(service.pexipAPI.audio_source).toBeNull();
        expect(service.pexipAPI.video_source).toBeNull();
=======

        currentStreamSubject.next(mockCamStream);

        service.setupClient();
        flush();
    }));

    it('should initialise user_media_stream', () => {
        expect(service.pexipAPI.user_media_stream).toBe(mockCamStream);
    });

    it('should try to initialise the userMediaService', () => {
        expect(userMediaService.initialise).toHaveBeenCalledTimes(1);
>>>>>>> origin
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
        service.pexipAPI = pexipSpy;
        service.disconnectFromCall();
        expect(pexipSpy.disconnect).toHaveBeenCalled();
        expect(kinlyHeartbeatServiceSpy.stopHeartbeat).toHaveBeenCalledTimes(1);
    });

    it('should not disconnect from pexip when api has not been initialised', () => {
        service.pexipAPI = null;
        expect(() => service.disconnectFromCall()).toThrowError('[VideoCallService] - Pexip Client has not been initialised.');
    });

    it('should call pexip with call details', () => {
        const node = 'node124';
        const conferenceAlias = 'WR173674fff';
        const participantDisplayName = 'T1;John Doe';
        const maxBandwidth = 767;
        service.pexipAPI = pexipSpy;

        service.makeCall(node, conferenceAlias, participantDisplayName, maxBandwidth);
        expect(pexipSpy.makeCall).toHaveBeenCalledWith(node, conferenceAlias, participantDisplayName, maxBandwidth, null);
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
        expect(apiClient.startOrResumeVideoHearing).toHaveBeenCalledWith(conferenceId, new StartHearingRequest({ layout }));
    });

    it('should make api pause call on pause hearing', async () => {
        apiClient.pauseVideoHearing.and.returnValue(of());
        const conferenceId = Guid.create().toString();
        await service.pauseHearing(conferenceId);
        expect(apiClient.pauseVideoHearing).toHaveBeenCalledWith(conferenceId);
    });

    it('should make api end call on end hearing', async () => {
        apiClient.endVideoHearing.and.returnValue(of());
        const conferenceId = Guid.create().toString();
        await service.endHearing(conferenceId);
        expect(apiClient.endVideoHearing).toHaveBeenCalledWith(conferenceId);
    });

    it('should update preferred layout', () => {
        const ss = new SessionStorage(service.PREFERRED_LAYOUT_KEY);
        ss.set({});
        const conferenceId = Guid.create().toString();
        expect(service.getPreferredLayout(conferenceId)).toBeUndefined();
        const layout = HearingLayout.OnePlus7;
        service.updatePreferredLayout(conferenceId, layout);
        expect(service.getPreferredLayout(conferenceId)).toBe(layout);
        ss.clear();
    });

    it('should make api call witness on call witness', async () => {
        apiClient.callParticipant.and.returnValue(of());
        const conferenceId = Guid.create().toString();
        const witnessId = Guid.create().toString();
        await service.callParticipantIntoHearing(conferenceId, witnessId);
        expect(apiClient.callParticipant).toHaveBeenCalledWith(conferenceId, witnessId);
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

<<<<<<< HEAD
=======
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
            expect(service.onCallTransferred()).toBeDefined();
            expect(service.onPresentation()).toBeDefined();
            expect(service.onPresentationConnected()).toBeDefined();
            expect(service.onPresentationDisconnected()).toBeDefined();
            expect(service.onScreenshareConnected()).toBeDefined();
            expect(service.onScreenshareStopped()).toBeDefined();
            expect(service.pexipAPI.turn_server).toBeDefined();
            expect(service.pexipAPI.turn_server.url).toContain(config.kinly_turn_server);
            expect(service.pexipAPI.turn_server.username).toContain(config.kinly_turn_server_user);
            expect(service.pexipAPI.turn_server.credential).toContain(config.kinly_turn_server_credential);
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

>>>>>>> origin
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
                protocol: 'protocol'
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
    });
});
