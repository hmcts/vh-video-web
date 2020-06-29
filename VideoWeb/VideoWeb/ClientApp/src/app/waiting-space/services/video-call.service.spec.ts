import { Logger } from 'src/app/services/logging/logger-base';
import { UserMediaService } from 'src/app/services/user-media.service';
import { UserMediaDevice } from 'src/app/shared/models/user-media-device';
import { MediaDeviceTestData } from 'src/app/testing/mocks/data/media-device-test-data';
import { MockLogger } from 'src/app/testing/mocks/MockLogger';
import { VideoCallService } from './video-call.service';
import { HttpClient } from '@angular/common/http';
import { of, throwError } from 'rxjs';

describe('VideoCallService', () => {
    let service: VideoCallService;
    const logger: Logger = new MockLogger();
    let userMediaService: jasmine.SpyObj<UserMediaService>;
    let httpClient: jasmine.SpyObj<HttpClient>;
    const testData = new MediaDeviceTestData();
    let preferredCamera: UserMediaDevice;
    let preferredMicrophone: UserMediaDevice;
    let pexipSpy: any;
    beforeAll(() => {
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

        httpClient = jasmine.createSpyObj<HttpClient>('HttpClient', ['options']);
    });

    beforeEach(() => {
        pexipSpy = jasmine.createSpyObj('pexipAPI', ['connect', 'makeCall', 'muteAudio', 'disconnect']);
        service = new VideoCallService(logger, userMediaService, httpClient);
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
        expect(() => service.disconnectFromCall()).toThrowError('Pexip Client has not been initialised');
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

    it('should return true if user can connect to judge control response is OK', async () => {
        const uri = 'https://test.url.com';
        const response = { ok: true };
        httpClient.options.and.returnValue(of(response));

        await expectAsync(service.canConnectToJudgeControl(uri)).toBeResolvedTo(true);
    });

    it('should return false if user can connect to judge control response is NOT OK', async () => {
        const uri = 'https://test.url.com';
        const response = { ok: false };
        httpClient.options.and.returnValue(of(response));

        await expectAsync(service.canConnectToJudgeControl(uri)).toBeResolvedTo(false);
    });

    it('should return false if user can connect to judge control response is NOT OK', async () => {
        const uri = 'https://test.url.com';
        const error = { status: 401, isApiException: true };
        httpClient.options.and.callFake(() => throwError(error));

        await expectAsync(service.canConnectToJudgeControl(uri)).toBeResolvedTo(false);
    });
});
