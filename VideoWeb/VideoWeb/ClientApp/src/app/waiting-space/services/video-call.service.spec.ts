import { Logger } from 'src/app/services/logging/logger-base';
import { UserMediaService } from 'src/app/services/user-media.service';
import { MediaDeviceTestData } from 'src/app/testing/mocks/data/media-device-test-data';
import { MockLogger } from 'src/app/testing/mocks/MockLogger';
import { VideoCallService } from './video-call.service';

describe('VideoCallService', () => {
    let service: VideoCallService;
    const logger: Logger = new MockLogger();
    let userMediaService: jasmine.SpyObj<UserMediaService>;
    const testData = new MediaDeviceTestData();

    beforeAll(() => {
        userMediaService = jasmine.createSpyObj<UserMediaService>('UserMediaService', [
            'getListOfVideoDevices',
            'getListOfMicrophoneDevices',
            'getPreferredCamera',
            'getPreferredMicrophone',
            'updatePreferredCamera',
            'updatePreferredMicrophone'
        ]);

        userMediaService.getListOfVideoDevices.and.resolveTo(testData.getListOfCameras());
        userMediaService.getListOfMicrophoneDevices.and.resolveTo(testData.getListOfMicrophones());
        userMediaService.getPreferredCamera.and.resolveTo(testData.getListOfCameras()[0]);
        userMediaService.getPreferredMicrophone.and.resolveTo(testData.getListOfMicrophones()[0]);
    });

    beforeEach(() => {
        service = new VideoCallService(logger, userMediaService);
    });
    it('should be created', () => {
        expect(service).toBeTruthy();
    });
});
