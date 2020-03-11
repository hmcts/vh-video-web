import { inject, TestBed } from '@angular/core/testing';
import { UserMediaDevice } from '../shared/models/user-media-device';
import { MediaDeviceTestData } from '../testing/mocks/data/media-device-test-data';
import { MockLogger } from '../testing/mocks/MockLogger';
import { Logger } from './logging/logger-base';
import { SessionStorage } from './session-storage';
import { UserMediaService } from './user-media.service';

describe('UserMediaService', () => {
    const testData = new MediaDeviceTestData();

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [UserMediaService, { provide: Logger, useClass: MockLogger }]
        });
    });

    it('should return only video devices', inject([UserMediaService], async (service: UserMediaService) => {
        service.availableDeviceList = testData.getListOfDevices();
        const devices = await service.getListOfVideoDevices();
        const unexpectedDevices = devices.filter(x => x.kind !== 'videoinput');
        expect(unexpectedDevices.length).toBe(0);
    }));

    it('should return only microphone devices', inject([UserMediaService], async (service: UserMediaService) => {
        service.availableDeviceList = testData.getListOfDevices();
        const devices = await service.getListOfMicrophoneDevices();
        const unexpectedDevices = devices.filter(x => x.kind !== 'audioinput');
        expect(unexpectedDevices.length).toBe(0);
    }));

    it('should update device list if empty', inject([UserMediaService], async (service: UserMediaService) => {
        spyOn(service, 'updateAvailableDevicesList').and.callFake(() => {
            service.availableDeviceList = testData.getListOfDevices();
        });
        await service.checkDeviceListIsReady();
        expect(service.updateAvailableDevicesList).toHaveBeenCalled();
    }));

    it('should return true when multiple inputs are detected', inject([UserMediaService], async (service: UserMediaService) => {
        spyOn(service, 'getListOfVideoDevices').and.returnValue(testData.getListOfCameras());
        spyOn(service, 'getListOfMicrophoneDevices').and.returnValue(testData.getListOfMicrophones());
        const multipleDevices = await service.hasMultipleDevices();
        expect(multipleDevices).toBeTruthy();
    }));

    it('should return false when single inputs are detected', inject([UserMediaService], async (service: UserMediaService) => {
        spyOn(service, 'getListOfVideoDevices').and.returnValue(testData.getSingleCamera());
        spyOn(service, 'getListOfMicrophoneDevices').and.returnValue(testData.getSingleMicrophone());
        const multipleDevices = await service.hasMultipleDevices();
        expect(multipleDevices).toBeFalsy();
    }));

    it('should update the device list', inject([UserMediaService], async (service: UserMediaService) => {
        spyOn(service, 'updateAvailableDevicesList').and.callFake(() => {
            service.availableDeviceList = testData.getListOfDevices();
        });
        await service.updateAvailableDevicesList();
        expect(service.availableDeviceList.length).toBeGreaterThan(0);
    }));

    it('should return null when cached device is not set', inject([UserMediaService], async (service: UserMediaService) => {
        const sessionStorage = new SessionStorage<UserMediaDevice>(service.PREFERRED_CAMERA_KEY);
        service.availableDeviceList = testData.getListOfDevices();
        sessionStorage.clear();
        const result = await service.getCachedDeviceIfStillConnected(sessionStorage);

        expect(result).toBeNull();
    }));

    it('should return null when cached device is not connected', inject([UserMediaService], async (service: UserMediaService) => {
        const sessionStorage = new SessionStorage<UserMediaDevice>(service.PREFERRED_CAMERA_KEY);
        service.availableDeviceList = testData.getListOfDevices();
        service.updatePreferredCamera(new UserMediaDevice('test', 'test', 'test', 'test'));
        const result = await service.getCachedDeviceIfStillConnected(sessionStorage);

        expect(result).toBeNull();
    }));

    it('should get cached device if still connected', inject([UserMediaService], async (service: UserMediaService) => {
        const sessionStorage = new SessionStorage<UserMediaDevice>(service.PREFERRED_CAMERA_KEY);
        service.availableDeviceList = testData.getListOfDevices();
        const cachedDevice = testData.getListOfDevices()[0];
        service.updatePreferredCamera(cachedDevice);
        const result = await service.getCachedDeviceIfStillConnected(sessionStorage);

        expect(result.deviceId).toBe(cachedDevice.deviceId);
    }));
});
