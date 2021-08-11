import { UserMediaDevice } from '../shared/models/user-media-device';
import { MediaDeviceTestData } from '../testing/mocks/data/media-device-test-data';
import { MockLogger } from '../testing/mocks/mock-logger';
import { SessionStorage } from './session-storage';
import { UserMediaService } from './user-media.service';
import { ErrorService } from '../services/error.service';
import { UserMediaStreamService } from './user-media-stream.service';

describe('UserMediaService', () => {
    const testData = new MediaDeviceTestData();
    let userMediaService: UserMediaService;
    let errrorServiceSpy: jasmine.SpyObj<ErrorService>;
    let userMediaStreamServiceSpy: UserMediaStreamService;

    beforeEach(() => {
        errrorServiceSpy = jasmine.createSpyObj<ErrorService>('ErrorService', ['handlePexipError']);
        userMediaStreamServiceSpy = new UserMediaStreamService(new MockLogger(), errrorServiceSpy);
        userMediaService = new UserMediaService(new MockLogger(), errrorServiceSpy, userMediaStreamServiceSpy);
        userMediaService.availableDeviceList = testData.getListOfDevices();
    });

    it('should return only video devices', async () => {
        const devices = await userMediaService.getListOfVideoDevices();
        const unexpectedDevices = devices.filter(x => x.kind !== 'videoinput');
        expect(unexpectedDevices.length).toBe(0);
    });

    it('should return only microphone devices', async () => {
        const devices = await userMediaService.getListOfMicrophoneDevices();
        const unexpectedDevices = devices.filter(x => x.kind !== 'audioinput');
        expect(unexpectedDevices.length).toBe(0);
    });

    it('should update device list if empty', async () => {
        userMediaService.availableDeviceList = [];
        spyOn(userMediaService, 'updateAvailableDevicesList').and.callFake(() => {
            userMediaService.availableDeviceList = testData.getListOfDevices();
            return Promise.resolve();
        });
        await userMediaService.checkDeviceListIsReady();
        expect(userMediaService.updateAvailableDevicesList).toHaveBeenCalled();
    });

    it('should return true when multiple inputs are detected', async () => {
        spyOn(userMediaService, 'getListOfVideoDevices').and.returnValue(Promise.resolve(testData.getListOfCameras()));
        spyOn(userMediaService, 'getListOfMicrophoneDevices').and.returnValue(Promise.resolve(testData.getListOfMicrophones()));
        const multipleDevices = await userMediaService.hasMultipleDevices();
        expect(multipleDevices).toBeTruthy();
    });

    it('should return false when single inputs are detected', async () => {
        spyOn(userMediaService, 'getListOfVideoDevices').and.returnValue(Promise.resolve(testData.getSingleCamera()));
        spyOn(userMediaService, 'getListOfMicrophoneDevices').and.returnValue(Promise.resolve(testData.getSingleMicrophone()));
        const multipleDevices = await userMediaService.hasMultipleDevices();
        expect(multipleDevices).toBeFalsy();
    });

    it('should update the device list', async () => {
        spyOn(userMediaService, 'updateAvailableDevicesList').and.callFake(() => {
            userMediaService.availableDeviceList = testData.getListOfDevices();
            return Promise.resolve();
        });
        await userMediaService.updateAvailableDevicesList();
        expect(userMediaService.availableDeviceList.length).toBeGreaterThan(0);
    });

    it('should return null when cached device is not set', async () => {
        const sessionStorage = new SessionStorage<UserMediaDevice>(userMediaService.PREFERRED_CAMERA_KEY);
        sessionStorage.clear();
        const result = await userMediaService.getCachedDevice(sessionStorage);

        expect(result).toBeNull();
    });

    it('should get cached device if still connected', async () => {
        const sessionStorage = new SessionStorage<UserMediaDevice>(userMediaService.PREFERRED_CAMERA_KEY);
        const cachedCamDevice = testData.getListOfCameras()[0];
        userMediaService.updatePreferredCamera(cachedCamDevice);

        const result = await userMediaService.getCachedDevice(sessionStorage);

        expect(result.deviceId).toBe(cachedCamDevice.deviceId);
    });

    it('should update cache with preferred cam', async () => {
        const sessionStorage = new SessionStorage<UserMediaDevice>(userMediaService.PREFERRED_CAMERA_KEY);
        sessionStorage.clear();
        const cachedDevice = testData.getListOfCameras()[0];

        userMediaService.updatePreferredCamera(cachedDevice);

        expect(sessionStorage.get().deviceId).toBe(cachedDevice.deviceId);
    });

    it('should update cache with preferred mic', async () => {
        const sessionStorage = new SessionStorage<UserMediaDevice>(userMediaService.PREFERRED_MICROPHONE_KEY);
        sessionStorage.clear();
        const cachedDevice = testData.getListOfMicrophones()[0];

        userMediaService.updatePreferredMicrophone(cachedDevice);

        expect(sessionStorage.get().deviceId).toBe(cachedDevice.deviceId);
    });

    it('should update available device list', async () => {
        userMediaService.availableDeviceList = undefined;
        spyOn(navigator.mediaDevices, 'getUserMedia');
        spyOn(userMediaService.connectedDevices, 'next');
        await userMediaService.updateAvailableDevicesList();
        expect(userMediaService.availableDeviceList).toBeDefined();
        expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalled();
        expect(userMediaService.connectedDevices.next).toHaveBeenCalledWith(userMediaService.availableDeviceList);
    });

    it('should throw error when media api is not available', async () => {
        userMediaService.navigator.mediaDevices.enumerateDevices = null;
        const message = 'enumerateDevices() not supported.';
        await expectAsync(userMediaService.updateAvailableDevicesList()).toBeRejectedWithError(message);
    });

    it('should update cache with default preferred mic and cam if it was not set', async () => {
        const sessionStorageMic = new SessionStorage<UserMediaDevice>(userMediaService.PREFERRED_MICROPHONE_KEY);
        const sessionStorageCam = new SessionStorage<UserMediaDevice>(userMediaService.PREFERRED_CAMERA_KEY);

        sessionStorageCam.clear();
        sessionStorageMic.clear();
        const cachedMics = testData.getListOfMicrophones();
        const cachedCams = testData.getListOfCameras();

        spyOn(userMediaService, 'getListOfVideoDevices').and.returnValue(Promise.resolve(cachedCams));
        spyOn(userMediaService, 'getListOfMicrophoneDevices').and.returnValue(Promise.resolve(cachedMics));

        await userMediaService.setDevicesInCache();

        expect(sessionStorageCam.get().label).toBe(cachedCams[0].label);
        expect(sessionStorageMic.get().label).toBe(cachedMics[0].label);
    });

    it('should update cache with default preferred mic and cam and throw exception if no devices available', async () => {
        const sessionStorageMic = new SessionStorage<UserMediaDevice>(userMediaService.PREFERRED_MICROPHONE_KEY);
        const sessionStorageCam = new SessionStorage<UserMediaDevice>(userMediaService.PREFERRED_CAMERA_KEY);

        sessionStorageCam.clear();
        sessionStorageMic.clear();
        const cachedMics = testData.getListOfMicrophones();

        spyOn(userMediaService, 'getListOfVideoDevices').and.throwError(new Error('Could not get access to camera/microphone'));
        spyOn(userMediaService, 'getListOfMicrophoneDevices').and.returnValue(Promise.resolve(cachedMics));

        await userMediaService.setDevicesInCache();

        expect(errrorServiceSpy.handlePexipError).toHaveBeenCalled();
    });

    it('should return stream of selected device when selecting screen to share', async () => {
        // Arrange
        const stream = <any>{};
        const getDisplayMediaSpy = spyOn(navigator.mediaDevices as any, 'getDisplayMedia')
            .withArgs({ video: true, audio: true })
            .and.returnValue(stream);

        // Act
        const resultStream = await userMediaService.selectScreenToShare();

        // Assert
        expect(resultStream).toBe(stream);
        expect(getDisplayMediaSpy).toHaveBeenCalledTimes(1);
    });

    it('should return null if exception is throw when selecting stream to share', async () => {
        // Arrange
        const getDisplayMediaSpy = spyOn(navigator.mediaDevices as any, 'getDisplayMedia')
            .withArgs({ video: true, audio: true })
            .and.throwError('testException');

        // Act
        const resultStream = await userMediaService.selectScreenToShare();

        // Assert
        expect(resultStream).toBe(null);
        expect(getDisplayMediaSpy).toHaveBeenCalledTimes(1);
    });
    
    it('should return device is disconnected', async () => {
        debugger;
        let device = testData.getListOfCameras()[0];
        device.label = "camera"
        let isConnected = await userMediaService.isDeviceStillConnected(device);
        expect(isConnected).toBeFalsy();
    });

    it('should return device is connected', async () => {
        debugger;
        let device = testData.getListOfCameras()[0];
        let isConnected = await userMediaService.isDeviceStillConnected(device);
        expect(isConnected).toBeTruthy();
    });
});
