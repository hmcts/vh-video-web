import { MediaDeviceTestData } from '../testing/mocks/data/media-device-test-data';
import { MockLogger } from '../testing/mocks/mock-logger';
import { UserMediaService } from './user-media.service';
import { LocalStorageService } from './conference/local-storage.service';
import { of, Subject } from 'rxjs';
import { fakeAsync, flush } from '@angular/core/testing';
import { UserMediaDevice } from '../shared/models/user-media-device';

describe('UserMediaService', () => {
    const testData = new MediaDeviceTestData();
    let userMediaService: UserMediaService;
    let localStorageServiceSpy: jasmine.SpyObj<LocalStorageService>;
    let getCameraAndMicrophoneDevicesSubject: Subject<UserMediaDevice[]>;

    beforeEach(() => {
        localStorageServiceSpy = jasmine.createSpyObj<LocalStorageService>('LocalStorageService', ['load', 'save']);
        getCameraAndMicrophoneDevicesSubject = new Subject<UserMediaDevice[]>();
        userMediaService = new UserMediaService(new MockLogger(), localStorageServiceSpy);
    });

    // it('should return true when multiple inputs are detected', fakeAsync(() => {
    //     spyOnProperty(userMediaService, 'connectedVideoDevices').and.returnValue(of(testData.getListOfCameras()));
    //     spyOnProperty(userMediaService, 'connectedMicrophoneDevices').and.returnValue(of(testData.getListOfMicrophones()));
    //     flush();
    //     let result;
    //     userMediaService.hasMultipleDevices().subscribe(hasMultipleDevices => (result = hasMultipleDevices));
    //     expect(result).toBeTrue();
    // }));

    // it('should return false when single inputs are detected', fakeAsync(() => {
    //     spyOnProperty(userMediaService, 'connectedVideoDevices').and.returnValue(of(testData.getSingleCamera()));
    //     spyOnProperty(userMediaService, 'connectedMicrophoneDevices').and.returnValue(of(testData.getSingleMicrophone()));
    //     flush();
    //     let result;
    //     userMediaService.hasMultipleDevices().subscribe(multipleDevices => {
    //         result = multipleDevices;
    //     });
    //     expect(result).toBeFalse();
    // }));

    // it('should update active microphone', fakeAsync(() => {
    //     spyOn<any>(userMediaService, 'setActiveMicrophone').and.callFake(function () {});
    //     spyOnProperty(userMediaService, 'activeMicrophoneDevice$').and.returnValue(of(testData.getListOfMicrophones()[0]));
    //     flush();
    //     const mic = testData.getListOfMicrophones()[1];
    //     userMediaService.updateActiveMicrophone(mic);
    //     flush();
    //     expect(userMediaService['setActiveMicrophone']).toHaveBeenCalledWith(testData.getListOfMicrophones()[1]);
    // }));

    // it('should not update active microphone', fakeAsync(() => {
    //     spyOn<any>(userMediaService, 'setActiveMicrophone').and.callFake(function () {});
    //     spyOnProperty(userMediaService, 'activeMicrophoneDevice$').and.returnValue(of(testData.getListOfMicrophones()[0]));
    //     flush();
    //     const mic = testData.getListOfMicrophones()[0];
    //     userMediaService.updateActiveMicrophone(mic);
    //     flush();
    //     expect(userMediaService['setActiveMicrophone']).not.toHaveBeenCalled();
    // }));

    // it('should return stream of selected device when selecting screen to share', async () => {
    //     const stream = <any>{};
    //     const getDisplayMediaSpy = spyOn(navigator.mediaDevices as any, 'getDisplayMedia')
    //         .withArgs({ video: true, audio: true })
    //         .and.returnValue(stream);
    //     const resultStream = await userMediaService.selectScreenToShare();
    //     expect(resultStream).toBe(stream);
    //     expect(getDisplayMediaSpy).toHaveBeenCalledTimes(1);
    // });

    // it('should return null if exception is throw when selecting stream to share', async () => {
    //     const getDisplayMediaSpy = spyOn(navigator.mediaDevices as any, 'getDisplayMedia')
    //         .withArgs({ video: true, audio: true })
    //         .and.throwError('testException');
    //     const resultStream = await userMediaService.selectScreenToShare();
    //     expect(resultStream).toBe(null);
    //     expect(getDisplayMediaSpy).toHaveBeenCalledTimes(1);
    // });

    it('should update active camera', fakeAsync(() => {
        spyOn<any>(userMediaService, 'setActiveCamera').and.callFake(function () {});
        spyOnProperty(userMediaService, 'activeVideoDevice$').and.returnValue(of(testData.getListOfCameras()[0]));
        flush();
        userMediaService.updateActiveCamera(testData.getListOfCameras()[1]);
        expect(userMediaService['setActiveCamera']).toHaveBeenCalledWith(testData.getListOfCameras()[1]);
    }));

    it('should not update active camera', fakeAsync(() => {
        spyOn<any>(userMediaService, 'setActiveCamera').and.callFake(function () {});
        spyOnProperty(userMediaService, 'activeVideoDevice$').and.returnValue(of(testData.getListOfCameras()[0]));
        flush();
        userMediaService.updateActiveCamera(testData.getListOfCameras()[0]);
        expect(userMediaService['setActiveCamera']).not.toHaveBeenCalled();
    }));

    it('should return flase when device is disconnected', fakeAsync(() => {
        spyOnProperty(userMediaService, 'connectedDevices$').and.returnValue(of(testData.getListOfDevices()));
        const disconnectedDevice = testData.getDisconnctedCamera();
        let result;
        userMediaService.isDeviceStillConnected(disconnectedDevice).subscribe(devices => (result = devices));
        flush();
        expect(result).toBeFalse();
    }));

    it('should return device when device is still connected', fakeAsync(() => {
        spyOnProperty(userMediaService, 'connectedDevices$').and.returnValue(of(testData.getListOfDevices()));
        const connectedDevice = testData.getListOfDevices()[0];
        let result;
        userMediaService.isDeviceStillConnected(connectedDevice).subscribe(devices => (result = devices));
        flush();
        expect(result).toBeTruthy();
    }));

    describe('updateIsAudioOnly', () => {
        it('should update isAudioOnly if the values are different', fakeAsync(() => {
            // Arrange
            userMediaService['isAudioOnly'] = false;

            // Act
            let audioOnly = null;
            userMediaService.isAudioOnly$.subscribe(isAudioOnly => (audioOnly = isAudioOnly));
            userMediaService.updateIsAudioOnly(true);
            flush();

            // Assert
            expect(audioOnly).toBeTrue();
        }));

        it('should NOT update isAudioOnly if the values are the same', fakeAsync(() => {
            // Arrange
            userMediaService['isAudioOnly'] = false;

            // Act
            let audioOnly = null;
            userMediaService.isAudioOnly$.subscribe(isAudioOnly => (audioOnly = isAudioOnly));
            userMediaService.updateIsAudioOnly(false);
            flush();

            // Assert
            expect(audioOnly).toBeNull();
        }));
    });

    describe('Construction', () => {
        beforeEach(() => {
            spyOn(UserMediaService.prototype, 'getCameraAndMicrophoneDevices').and.returnValue(
                getCameraAndMicrophoneDevicesSubject.asObservable()
            );
            spyOn(UserMediaService.prototype, 'hasValidCameraAndMicAvailable').and.returnValue(of(true));
            userMediaService = new UserMediaService(new MockLogger(), localStorageServiceSpy);
        });

        it('should handle device change', fakeAsync(() => {
            spyOn<any>(userMediaService, 'initialiseActiveDevicesFromCache').and.callFake(function () {});
            spyOn<any>(userMediaService, 'checkActiveDevicesAreStillConnected').and.callFake(function () {});
            getCameraAndMicrophoneDevicesSubject.next(testData.getListOfDevices());
            flush();
            expect(userMediaService['initialiseActiveDevicesFromCache']).toHaveBeenCalledWith(testData.getListOfDevices());
            expect(userMediaService['checkActiveDevicesAreStillConnected']).toHaveBeenCalledWith(testData.getListOfDevices());
        }));

        it('should return list of devices', fakeAsync(() => {
            getCameraAndMicrophoneDevicesSubject.next(testData.getListOfDevices());
            flush();
            let result = [];
            userMediaService.connectedDevices$.subscribe(devices => (result = devices));
            flush();
            expect(result.length).toBe(6);
        }));

        it('should return only microphone devices', fakeAsync(() => {
            getCameraAndMicrophoneDevicesSubject.next(testData.getListOfDevices());
            flush();
            let result = [];
            userMediaService.connectedVideoDevices.subscribe(devices => (result = devices));
            flush();
            expect(result.length).toBe(3);
        }));

        it('should return only video devices', fakeAsync(() => {
            getCameraAndMicrophoneDevicesSubject.next(testData.getListOfDevices());
            flush();
            let result = [];
            userMediaService.connectedVideoDevices.subscribe(devices => (result = devices));
            flush();
            expect(result.length).toBe(3);
        }));

        it('should set default cam to cache', fakeAsync(() => {
            localStorageServiceSpy.load.and.returnValue(null);
            spyOn<any>(userMediaService, 'setActiveCamera').and.callFake(function () {});
            spyOn<any>(userMediaService, 'loadDefaultCamera').and.callThrough();

            getCameraAndMicrophoneDevicesSubject.next(testData.getListOfDevices());
            flush();
            expect(userMediaService['setActiveCamera']).toHaveBeenCalledOnceWith(testData.getListOfCameras()[0]);
            expect(userMediaService['loadDefaultCamera']).toHaveBeenCalledOnceWith(testData.getListOfDevices());
        }));

        it('should set default mic to cache', fakeAsync(() => {
            localStorageServiceSpy.load.and.returnValue(null);
            spyOn<any>(userMediaService, 'setActiveMicrophone').and.callFake(function () {});
            spyOn<any>(userMediaService, 'loadDefaultMicrophone').and.callThrough();

            getCameraAndMicrophoneDevicesSubject.next(testData.getListOfDevices());
            flush();
            expect(userMediaService['setActiveMicrophone']).toHaveBeenCalledOnceWith(testData.getListOfMicrophones()[0]);
            expect(userMediaService['loadDefaultMicrophone']).toHaveBeenCalledOnceWith(testData.getListOfDevices());
        }));
    });
});
