import { Logger } from 'src/app/services/logging/logger-base';
import { UserMediaService } from 'src/app/services/user-media.service';
import { UserMediaDevice } from 'src/app/shared/models/user-media-device';
import { MediaDeviceTestData } from 'src/app/testing/mocks/data/media-device-test-data';
import { MockLogger } from 'src/app/testing/mocks/MockLogger';
import { VideoCallService } from './video-call.service';
import { Guid } from 'guid-typescript';
import { ApiClient, StartHearingRequest } from 'src/app/services/clients/api-client';
import { of } from 'rxjs';
import { HearingLayout } from 'src/app/services/clients/api-client';
import { SessionStorage } from 'src/app/services/session-storage';

describe('VideoCallService', () => {
    let service: VideoCallService;
    let apiClient: jasmine.SpyObj<ApiClient>;
    const logger: Logger = new MockLogger();
    let userMediaService: jasmine.SpyObj<UserMediaService>;
    const testData = new MediaDeviceTestData();
    let preferredCamera: UserMediaDevice;
    let preferredMicrophone: UserMediaDevice;
    let pexipSpy: jasmine.SpyObj<PexipClient>;
    beforeAll(() => {
        apiClient = jasmine.createSpyObj<ApiClient>('ApiClient', ['startOrResumeVideoHearing', 'pauseVideoHearing', 'endVideoHearing']);

        userMediaService = jasmine.createSpyObj<UserMediaService>('UserMediaService', [
            'getListOfVideoDevices',
            'getListOfMicrophoneDevices',
            'getPreferredCamera',
            'getPreferredMicrophone',
            'updatePreferredCamera',
            'updatePreferredMicrophone'
        ]);

        preferredCamera = testData.getListOfCameras()[0];
        preferredMicrophone = testData.getListOfMicrophones()[0];
        userMediaService.getListOfVideoDevices.and.resolveTo(testData.getListOfCameras());
        userMediaService.getListOfMicrophoneDevices.and.resolveTo(testData.getListOfMicrophones());
        userMediaService.getPreferredCamera.and.resolveTo(preferredCamera);
        userMediaService.getPreferredMicrophone.and.resolveTo(preferredMicrophone);
    });

    beforeEach(async () => {
        pexipSpy = jasmine.createSpyObj<PexipClient>('PexipClient', [
            'connect',
            'makeCall',
            'muteAudio',
            'disconnect',
            'setBuzz',
            'clearBuzz',
            'setParticipantMute',
            'setMuteAllGuests',
            'clearAllBuzz',
            'setParticipantSpotlight'
        ]);
        service = new VideoCallService(logger, userMediaService, apiClient);
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
    });

    it('should use default devices on setup if no preferred devices found', async () => {
        userMediaService.getPreferredCamera.and.resolveTo(null);
        userMediaService.getPreferredMicrophone.and.resolveTo(null);

        await service.setupClient();

        expect(service.pexipAPI.audio_source).toBeNull();
        expect(service.pexipAPI.video_source).toBeNull();
    });

    it('should toggle mute', () => {
        pexipSpy.muteAudio.and.returnValue(true);
        service.pexipAPI = pexipSpy;
        const result = service.toggleMute();
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
        expect(pexipSpy.makeCall).toHaveBeenCalledWith(node, conferenceAlias, participantDisplayName, maxBandwidth);
    });

    it('should set buzz when hand is raised', () => {
        service.pexipAPI = pexipSpy;
        service.raiseHand();
        expect(pexipSpy.setBuzz).toHaveBeenCalledTimes(1);
    });

    it('should clear buzz when hand is lowered', () => {
        service.pexipAPI = pexipSpy;
        service.lowerHand();
        expect(pexipSpy.clearBuzz).toHaveBeenCalledTimes(1);
    });
    it('should clear buzz when hand is lowered for participant uuid', () => {
        service.pexipAPI = pexipSpy;
        const uuid = '12345';
        service.lowerHandById(uuid);
        expect(pexipSpy.clearBuzz).toHaveBeenCalledWith(uuid);
    });
    it('should clear all buzz when hand is lowered for all participants', () => {
        service.pexipAPI = pexipSpy;
        service.lowerAllHands();
        expect(pexipSpy.clearAllBuzz).toHaveBeenCalledTimes(1);
    });
    it('should make api start call on start hearing', async () => {
        apiClient.startOrResumeVideoHearing.and.returnValue(of());
        const conferenceId = Guid.create().toString();
        const layout = HearingLayout.TwoPlus21;
        await service.startHearing(conferenceId, layout);
        expect(apiClient.startOrResumeVideoHearing).toHaveBeenCalledWith(conferenceId, new StartHearingRequest({ layout }));
    });

    it('should make api start call on pause hearing', async () => {
        apiClient.pauseVideoHearing.and.returnValue(of());
        const conferenceId = Guid.create().toString();
        await service.pauseHearing(conferenceId);
        expect(apiClient.pauseVideoHearing).toHaveBeenCalledWith(conferenceId);
    });

    it('should make api start call on end hearing', async () => {
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
});
