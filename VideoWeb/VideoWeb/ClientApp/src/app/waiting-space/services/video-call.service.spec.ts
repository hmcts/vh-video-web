import { discardPeriodicTasks, fakeAsync, flush } from '@angular/core/testing';
import { Guid } from 'guid-typescript';
import { of, ReplaySubject } from 'rxjs';
import { ConfigService } from 'src/app/services/api/config.service';
import { ClientSettingsResponse, HearingLayout, Supplier, SupplierConfigurationResponse } from 'src/app/services/clients/api-client';
import { HeartbeatService } from 'src/app/services/conference/heartbeat.service';
import { Logger } from 'src/app/services/logging/logger-base';
import { StreamMixerService } from 'src/app/services/stream-mixer.service';
import { UserMediaService } from 'src/app/services/user-media.service';
import { getSpiedPropertyGetter } from 'src/app/shared/jasmine-helpers/property-helpers';
import { MockLogger } from 'src/app/testing/mocks/mock-logger';
import { ConferenceUpdated, ParticipantDeleted, ParticipantUpdated } from '../models/video-call-models';
import { mockCamAndMicStream } from '../waiting-room-shared/tests/waiting-room-base-setup';
import { VideoCallService } from './video-call.service';
import { MockStore, createMockStore } from '@ngrx/store/testing';
import { initialState as initialConferenceState, ConferenceState } from '../store/reducers/conference.reducer';
import { UserMediaStreamServiceV2 } from 'src/app/services/user-media-stream-v2.service';
import { FEATURE_FLAGS, LaunchDarklyService } from 'src/app/services/launch-darkly.service';
import { ConferenceActions } from '../store/actions/conference.actions';
import { mapPexipConferenceToVhPexipConference } from '../store/models/api-contract-to-state-model-mappers';
import { VideoCallActions } from '../store/actions/video-call.action';

const supplier = Supplier.Vodafone;
const config = new ClientSettingsResponse({
    supplier_configurations: [
        new SupplierConfigurationResponse({
            supplier: Supplier.Vodafone,
            turn_server: 'turnserver',
            turn_server_user: 'tester1',
            turn_server_credential: 'credential'
        })
    ]
});

describe('VideoCallService', () => {
    let service: VideoCallService;
    const logger: Logger = new MockLogger();
    let userMediaService: jasmine.SpyObj<UserMediaService>;

    let userMediaStreamService: jasmine.SpyObj<UserMediaStreamServiceV2>;
    let currentStreamSubject: ReplaySubject<MediaStream>;

    let pexipSpy: jasmine.SpyObj<PexipClient>;
    let configServiceSpy: jasmine.SpyObj<ConfigService>;
    let heartbeatServiceSpy: jasmine.SpyObj<HeartbeatService>;
    let streamMixerServiceSpy: jasmine.SpyObj<StreamMixerService>;
    let mockStore: MockStore<ConferenceState>;
    let launchDarklyServiceSpy: jasmine.SpyObj<LaunchDarklyService>;
    let isAudioOnlySubject: ReplaySubject<boolean>;

    beforeEach(fakeAsync(() => {
        const initialState = initialConferenceState;
        launchDarklyServiceSpy = jasmine.createSpyObj<LaunchDarklyService>('LaunchDarklyService', ['getFlag']);
        launchDarklyServiceSpy.getFlag.withArgs(FEATURE_FLAGS.uniqueCallTags, true).and.returnValue(of(true));
        mockStore = createMockStore({ initialState });

        userMediaService = jasmine.createSpyObj<UserMediaService>(
            'UserMediaService',
            ['selectScreenToShare', 'initialise', 'checkCameraAndMicrophonePresence', 'updateStartWithAudioMuted'],
            ['isAudioOnly$']
        );

        isAudioOnlySubject = new ReplaySubject<boolean>(1);
        getSpiedPropertyGetter(userMediaService, 'isAudioOnly$').and.returnValue(isAudioOnlySubject.asObservable());

        userMediaStreamService = jasmine.createSpyObj<UserMediaStreamServiceV2>(
            ['createAndPublishStream', 'closeCurrentStream'],
            ['currentStream$']
        );

        currentStreamSubject = new ReplaySubject<MediaStream>(1);
        getSpiedPropertyGetter(userMediaStreamService, 'currentStream$').and.returnValue(currentStreamSubject.asObservable());
        userMediaService.checkCameraAndMicrophonePresence.and.returnValue(Promise.resolve({ hasACamera: true, hasAMicrophone: true }));

        heartbeatServiceSpy = jasmine.createSpyObj<HeartbeatService>(['initialiseHeartbeat', 'stopHeartbeat']);

        configServiceSpy = jasmine.createSpyObj<ConfigService>('ConfigService', ['getConfig']);
        configServiceSpy.getConfig.and.returnValue(config);
        pexipSpy = jasmine.createSpyObj<PexipClient>(
            'PexipClient',
            [
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
            ],
            ['call', 'state']
        );
        getSpiedPropertyGetter(pexipSpy, 'state').and.returnValue('CONNECTED');

        streamMixerServiceSpy = jasmine.createSpyObj<StreamMixerService>('StreamMixerService', ['mergeAudioStreams']);

        service = new VideoCallService(
            logger,
            userMediaService,
            userMediaStreamService,
            configServiceSpy,
            heartbeatServiceSpy,
            streamMixerServiceSpy,
            mockStore,
            launchDarklyServiceSpy
        );
        getSpiedPropertyGetter(mockCamAndMicStream, 'active').and.returnValue(true);
        currentStreamSubject.next(mockCamAndMicStream);

        service.setupClient(supplier);
        flush();
    }));

    it('should initialise user_media_stream', () => {
        expect(service.pexipAPI.user_media_stream).toBe(mockCamAndMicStream);
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
        expect(userMediaStreamService.closeCurrentStream).toHaveBeenCalledTimes(1);
    });

    it('should not disconnect from pexip when api has not been initialised', () => {
        service.pexipAPI = null;
        expect(() => service.disconnectFromCall()).not.toThrowError('[VideoCallService] - Pexip Client has not been initialised.');
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
    });

    it('should diconnected from call before making a new call is call exist on Pexip Client', async () => {
        const node = 'node124';
        const conferenceAlias = 'WR173674fff';
        const participantDisplayName = 'T1;John Doe';
        const maxBandwidth = 767;

        const callSpy = jasmine.createSpyObj<PexRTCCall>('PexRTCCall', [], ['stream']);
        getSpiedPropertyGetter(pexipSpy, 'call').and.returnValue(callSpy);
        const disconnectFromCallSpy = spyOn(service, 'disconnectFromCall').and.callFake(() => {
            service.pexipAPI = pexipSpy;
        });

        service.pexipAPI = pexipSpy;

        await service.makeCall(node, conferenceAlias, participantDisplayName, maxBandwidth, null);
        expect(disconnectFromCallSpy).toHaveBeenCalled();
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

    describe('renegotiateCall', () => {
        it('should call renegotiate', () => {
            service.pexipAPI = pexipSpy;

            service.renegotiateCall();

            expect(pexipSpy.renegotiate).toHaveBeenCalled();
        });

        it('should not call renegotiate when pexip client is not initialised', () => {
            getSpiedPropertyGetter(pexipSpy, 'state').and.returnValue('DISCONNECTED');

            service.renegotiateCall();
            expect(pexipSpy.renegotiate).not.toHaveBeenCalled();
        });
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
        expect(pexipSpy.present).toHaveBeenCalledWith(null);
    });

    describe('PexipAPI onConnect', () => {
        it('should call initialiseHeartbeat', fakeAsync(() => {
            spyOn<any>(service, 'renegotiateCall').and.callThrough();
            service.pexipAPI.onConnect(mockCamAndMicStream);
            flush();
            flush();
            discardPeriodicTasks();
            expect(heartbeatServiceSpy.initialiseHeartbeat).toHaveBeenCalledTimes(1);
        }));
    });

    describe('SetupClient', () => {
        it('should init pexip and set pexip client', async () => {
            await service.setupClient(supplier);
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
            expect(service.pexipAPI.turn_server.urls).toContain(config.supplier_configurations[0].turn_server);
            expect(service.pexipAPI.turn_server.username).toContain(config.supplier_configurations[0].turn_server_user);
            expect(service.pexipAPI.turn_server.credential).toContain(config.supplier_configurations[0].turn_server_credential);
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
            service.pexipAPI.user_media_stream = mockCamAndMicStream;
            service.setupClient(supplier);
            currentStreamSubject.next(mockCamAndMicStream);
            flush();
            expect(service.pexipAPI.user_media_stream).toEqual(mockCamAndMicStream);
        }));

        it('should call renegotiateCall', fakeAsync(() => {
            spyOn<any>(service, 'renegotiateCall').and.callThrough();
            service.pexipAPI.user_media_stream = mockCamAndMicStream;

            service.setupClient(supplier);
            currentStreamSubject.next(mockCamAndMicStream);
            currentStreamSubject.next(mockCamAndMicStream);
            service.pexipAPI.user_media_stream = mockCamAndMicStream;
            currentStreamSubject.next(mockCamAndMicStream);
            flush();
            discardPeriodicTasks();
            expect(service['renegotiateCall']).toHaveBeenCalled();
        }));

        describe('handleAudioOnlyChange', () => {
            describe('audioOnly true', () => {
                it('should toggle video on pexip client if client does not match user toggle', fakeAsync(() => {
                    const dispatchSpy = spyOn(mockStore, 'dispatch');
                    service.pexipAPI = pexipSpy;
                    spyOn<any>(service, 'handleAudioOnlyChange').and.callThrough();

                    const callSpy = jasmine.createSpyObj<PexRTCCall>('PexRTCCall', [], { mutedVideo: false });
                    getSpiedPropertyGetter(pexipSpy, 'call').and.returnValue(callSpy);

                    isAudioOnlySubject.next(true);
                    flush(); // Ensure all asynchronous operations are completed
                    discardPeriodicTasks();

                    expect(service['handleAudioOnlyChange']).toHaveBeenCalledWith(true);
                    expect(dispatchSpy).toHaveBeenCalledWith(VideoCallActions.toggleOutgoingVideo());
                }));

                it('should not toggle video on pexip client if client does match user toggle', fakeAsync(() => {
                    const dispatchSpy = spyOn(mockStore, 'dispatch');
                    service.pexipAPI = pexipSpy;
                    spyOn<any>(service, 'handleAudioOnlyChange').and.callThrough();

                    const callSpy = jasmine.createSpyObj<PexRTCCall>('PexRTCCall', [], { mutedVideo: true });
                    getSpiedPropertyGetter(pexipSpy, 'call').and.returnValue(callSpy);

                    isAudioOnlySubject.next(true);
                    flush(); // Ensure all asynchronous operations are completed
                    discardPeriodicTasks();

                    expect(service['handleAudioOnlyChange']).toHaveBeenCalledWith(true);
                    expect(dispatchSpy).not.toHaveBeenCalledWith(VideoCallActions.toggleOutgoingVideo());
                }));
            });

            describe('audioOnly false', () => {
                it('should update pexip client video props to null when audioOnly is false', fakeAsync(() => {
                    service.pexipAPI = pexipSpy;
                    spyOn<any>(service, 'handleAudioOnlyChange').and.callThrough();

                    isAudioOnlySubject.next(false);
                    flush(); // Ensure all asynchronous operations are completed
                    discardPeriodicTasks();

                    expect(service['handleAudioOnlyChange']).toHaveBeenCalledWith(false);
                }));
            });
        });
    });

    describe('handleConferenceUpdate', () => {
        it('should publish the conference update', fakeAsync(() => {
            // Arrange
            service.pexipAPI.call_type = 'hearing';
            const dispatchSpy = spyOn(mockStore, 'dispatch');
            const pexipConference: PexipConference = { started: true, locked: false, guests_muted: true, direct_media: false };
            // Act
            let result: ConferenceUpdated | null = null;
            const expectedUpdated = ConferenceUpdated.fromPexipConference(pexipConference);
            service.onConferenceUpdated().subscribe(update => (result = update));

            service.pexipAPI.onConferenceUpdate(pexipConference);
            flush();

            // Assert
            expect(result).toBeTruthy();
            expect(result).toEqual(expectedUpdated);
            expect(dispatchSpy).toHaveBeenCalledWith(
                ConferenceActions.upsertPexipConference({
                    pexipConference: mapPexipConferenceToVhPexipConference(ConferenceUpdated.fromPexipConference(pexipConference))
                })
            );
        }));

        it('should not publish the conference update if test call', fakeAsync(() => {
            // Arrange
            service.pexipAPI.call_type = 'test_call';
            const dispatchSpy = spyOn(mockStore, 'dispatch');
            const pexipConference: PexipConference = { started: true, locked: false, guests_muted: true, direct_media: false };
            // Act
            let result: ConferenceUpdated | null = null;
            const expectedUpdated = ConferenceUpdated.fromPexipConference(pexipConference);
            service.onConferenceUpdated().subscribe(update => (result = update));

            service.pexipAPI.onConferenceUpdate(pexipConference);
            flush();

            // Assert
            expect(result).toBeTruthy();
            expect(result).toEqual(expectedUpdated);

            expect(dispatchSpy).not.toHaveBeenCalled();
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
                role: 'GUEST',
                is_video_silent: false,
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
                role: undefined,
                is_video_silent: undefined,
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
                role: 'GUEST',
                is_video_silent: false,
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

            mockCamAndMicStream.getAudioTracks.and.returnValue([micAudioTrack]);
        });

        it('should replace pexip media stream with screen and mic stream', fakeAsync(async () => {
            spyOn<any>(service, 'renegotiateCall').and.callThrough();
            service.pexipAPI.user_media_stream = screenStream;

            await service.selectScreenWithMicrophone();

            flush();

            expect(service['renegotiateCall']).toHaveBeenCalled();
            expect(service.pexipAPI.user_media_stream).not.toBe(mockCamAndMicStream);
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
            expect(service.pexipAPI.user_media_stream).toEqual(mockCamAndMicStream);
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

    describe('callParticipantByTelephone', () => {
        it('should call pexip dialOut', () => {
            service.pexipAPI = pexipSpy;
            const phoneNumber = '0123456789';
            const callbackFn = () => {};

            const expectedParams: PexipDialOutParams = {
                call_type: 'audio',
                remote_display_name: '6789',
                overlay_text: '6789'
            };

            service.callParticipantByTelephone(phoneNumber, callbackFn);

            expect(pexipSpy.dialOut).toHaveBeenCalledWith(`611${phoneNumber}`, 'auto', 'GUEST', callbackFn, expectedParams);
        });
    });

    describe('logMediaStreamInfo', () => {
        it('should log media stream set when user stream has been assigned to pexip client', () => {
            service.pexipAPI = pexipSpy;
            pexipSpy.user_media_stream = mockCamAndMicStream;
            spyOn(logger, 'debug');
            service.logMediaStreamInfo();
            expect(logger.debug).toHaveBeenCalledWith('[VideoCallService] - set user media stream', 'stream set');
        });

        it('should log media stream not set when user stream has not been assigned to pexip client', () => {
            service.pexipAPI = pexipSpy;
            pexipSpy.user_media_stream = null;
            spyOn(logger, 'debug');
            service.logMediaStreamInfo();
            expect(logger.debug).toHaveBeenCalledWith('[VideoCallService] - set user media stream', 'stream not set');
        });
    });
});
