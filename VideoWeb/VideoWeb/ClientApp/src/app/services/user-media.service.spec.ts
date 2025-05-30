import { MediaDeviceTestData } from '../testing/mocks/data/media-device-test-data';
import { MockLogger } from '../testing/mocks/mock-logger';
import { UserMediaService } from './user-media.service';
import { LocalStorageService } from './conference/local-storage.service';
import { of, Subject, throwError } from 'rxjs';
import { fakeAsync, flush } from '@angular/core/testing';
import { UserMediaDevice } from '../shared/models/user-media-device';
import { Guid } from 'guid-typescript';
import { ConferenceSetting } from '../shared/models/conference-setting';
import { cold } from 'jasmine-marbles';

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

    describe('hasValidCameraAndMicAvailable', () => {
        it('should throw an error when hasValidCameraAndMicAvailable fails', () => {
            spyOn<any>(navigator.mediaDevices, 'getUserMedia').and.returnValue(throwError(new DOMException('Permission denied')));

            const result$ = userMediaService.hasValidCameraAndMicAvailable();

            expect(result$).toBeObservable(cold('#', null, new Error('Permission denied')));
        });

        it('should return false when hasValidCameraAndMicAvailable fails and is not related to permission denied', () => {
            spyOn<any>(navigator.mediaDevices, 'getUserMedia').and.returnValue(throwError(new DOMException('Not a permission denied')));

            const result$ = userMediaService.hasValidCameraAndMicAvailable();

            expect(result$).toBeObservable(cold('(a|)', { a: false }));
        });
    });

    it('should return true when multiple inputs are detected', fakeAsync(() => {
        spyOnProperty(userMediaService, 'connectedVideoDevices$').and.returnValue(of(testData.getListOfCameras()));
        spyOnProperty(userMediaService, 'connectedMicrophoneDevices$').and.returnValue(of(testData.getListOfMicrophones()));
        flush();
        let result;
        userMediaService.hasMultipleDevices().subscribe(hasMultipleDevices => (result = hasMultipleDevices));
        expect(result).toBeTrue();
    }));

    it('should return false when single inputs are detected', fakeAsync(() => {
        spyOnProperty(userMediaService, 'connectedVideoDevices$').and.returnValue(of(testData.getSingleCamera()));
        spyOnProperty(userMediaService, 'connectedMicrophoneDevices$').and.returnValue(of(testData.getSingleMicrophone()));
        flush();
        let result;
        userMediaService.hasMultipleDevices().subscribe(multipleDevices => {
            result = multipleDevices;
        });
        expect(result).toBeFalse();
    }));

    it('should update active microphone', fakeAsync(() => {
        spyOn<any>(userMediaService, 'setActiveMicrophone').and.callFake(function () {});
        spyOnProperty(userMediaService, 'activeMicrophoneDevice$').and.returnValue(of(testData.getListOfMicrophones()[0]));
        flush();
        const mic = testData.getListOfMicrophones()[1];
        userMediaService.updateActiveMicrophone(mic);
        flush();
        expect(userMediaService['setActiveMicrophone']).toHaveBeenCalledWith(testData.getListOfMicrophones()[1]);
    }));

    it('should not update active microphone', fakeAsync(() => {
        spyOn<any>(userMediaService, 'setActiveMicrophone').and.callFake(function () {});
        spyOnProperty(userMediaService, 'activeMicrophoneDevice$').and.returnValue(of(testData.getListOfMicrophones()[0]));
        flush();
        const mic = testData.getListOfMicrophones()[0];
        userMediaService.updateActiveMicrophone(mic);
        flush();
        expect(userMediaService['setActiveMicrophone']).not.toHaveBeenCalled();
    }));

    it('should return stream of selected device when selecting screen to share', async () => {
        const stream = <any>{};
        const getDisplayMediaSpy = spyOn(navigator.mediaDevices as any, 'getDisplayMedia')
            .withArgs({ video: true, audio: true })
            .and.returnValue(stream);
        const resultStream = await userMediaService.selectScreenToShare();
        expect(resultStream).toBe(stream);
        expect(getDisplayMediaSpy).toHaveBeenCalledTimes(1);
    });

    it('should return null if exception is throw when selecting stream to share', async () => {
        const getDisplayMediaSpy = spyOn(navigator.mediaDevices as any, 'getDisplayMedia')
            .withArgs({ video: true, audio: true })
            .and.throwError('testException');
        const resultStream = await userMediaService.selectScreenToShare();
        expect(resultStream).toBe(null);
        expect(getDisplayMediaSpy).toHaveBeenCalledTimes(1);
    });

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

    it('should return false when device is disconnected', fakeAsync(() => {
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

    it('isDeviceStillConnected should return return false if device object hasnt been set', fakeAsync(() => {
        const connectedDevice = null;
        let result;
        userMediaService.isDeviceStillConnected(connectedDevice).subscribe(devices => (result = devices));
        flush();
        expect(result).toBeFalse();
    }));

    it('should get camera and microphone devices', fakeAsync(() => {
        spyOn(navigator.mediaDevices as any, 'enumerateDevices').and.resolveTo(testData.getListOfDevices());

        let result;
        userMediaService.getCameraAndMicrophoneDevices().subscribe(devices => (result = devices));
        flush();
        expect(result.length).toBeGreaterThan(0);
    }));

    it('should return the presence of a camera and a microphone', async () => {
        spyOn(navigator.mediaDevices as any, 'enumerateDevices').and.resolveTo(testData.getListOfDevices());

        const result = await userMediaService.checkCameraAndMicrophonePresence();

        expect(result.hasACamera).toBeTrue();
        expect(result.hasAMicrophone).toBeTrue();
    });

    it('should filter devices with device ids of default and communications camera and microphone devices', fakeAsync(() => {
        const deviceList = testData.getListOfDevices();
        deviceList.push(new UserMediaDevice('Default Test', 'default', 'audioinput', Guid.create().toString()));
        deviceList.push(new UserMediaDevice('Default Test', 'communications', 'audioinput', Guid.create().toString()));
        spyOn(navigator.mediaDevices as any, 'enumerateDevices').and.resolveTo(deviceList);

        let result: UserMediaDevice[];
        userMediaService.getCameraAndMicrophoneDevices().subscribe(devices => (result = devices));
        flush();
        expect(result.find(x => x.deviceId === 'default')).toBeUndefined();
        expect(result.find(x => x.deviceId === 'communications')).toBeUndefined();
    }));

    it('should NOT filter devices with device ids of default and communications camera and microphone devices IF they are the only devices', fakeAsync(() => {
        const deviceList = [];
        deviceList.push(new UserMediaDevice('Default Test', 'default', 'audioinput', Guid.create().toString()));
        deviceList.push(new UserMediaDevice('Default Test', 'communications', 'audioinput', Guid.create().toString()));
        spyOn(navigator.mediaDevices as any, 'enumerateDevices').and.resolveTo(deviceList);

        let result: UserMediaDevice[];
        userMediaService.getCameraAndMicrophoneDevices().subscribe(devices => (result = devices));
        flush();
        expect(result.find(x => x.deviceId === 'default')).toBeTruthy();
        expect(result.find(x => x.deviceId === 'communications')).toBeTruthy();
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

    describe('initialise', () => {
        beforeEach(() => {
            spyOn(UserMediaService.prototype, 'getCameraAndMicrophoneDevices').and.returnValue(
                getCameraAndMicrophoneDevicesSubject.asObservable()
            );
            spyOn(UserMediaService.prototype, 'hasValidCameraAndMicAvailable').and.returnValue(of(true));
            userMediaService = new UserMediaService(new MockLogger(), localStorageServiceSpy);
            userMediaService.initialise();
        });

        it('should handle device change', fakeAsync(() => {
            spyOn<any>(userMediaService, 'initialiseActiveDevicesFromCache').and.callFake(function () {});
            spyOn<any>(userMediaService, 'checkActiveDevicesAreStillConnected').and.callFake(function () {});
            getCameraAndMicrophoneDevicesSubject.next(testData.getListOfDevices());
            flush();
            expect(userMediaService['initialiseActiveDevicesFromCache']).toHaveBeenCalledWith(testData.getListOfDevices());
            expect(userMediaService['checkActiveDevicesAreStillConnected']).toHaveBeenCalledWith(testData.getListOfDevices());
        }));

        it('should handle device change', fakeAsync(() => {
            spyOn<any>(userMediaService, 'setActiveCamera').and.callThrough();
            spyOn<any>(userMediaService, 'loadDefaultCamera').and.callThrough();
            spyOn<any>(userMediaService, 'setActiveMicrophone').and.callThrough();
            spyOn<any>(userMediaService, 'loadDefaultMicrophone').and.callThrough();

            spyOn(userMediaService, 'isDeviceStillConnected').and.returnValue(of(false));
            spyOn<any>(userMediaService, 'checkActiveDevicesAreStillConnected').and.callThrough();

            getCameraAndMicrophoneDevicesSubject.next(testData.getListOfDevices());
            flush();

            expect(userMediaService['setActiveCamera']).toHaveBeenCalled();
            expect(userMediaService['loadDefaultCamera']).toHaveBeenCalled();
            expect(userMediaService['setActiveMicrophone']).toHaveBeenCalled();
            expect(userMediaService['loadDefaultMicrophone']).toHaveBeenCalled();
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
            userMediaService.connectedMicrophoneDevices$.subscribe(devices => (result = devices));
            flush();
            expect(result.length).toBe(2);
        }));

        it('should return only video devices', fakeAsync(() => {
            getCameraAndMicrophoneDevicesSubject.next(testData.getListOfDevices());
            flush();
            let result = [];
            userMediaService.connectedVideoDevices$.subscribe(devices => (result = devices));
            flush();
            expect(result.length).toBe(3);
        }));

        it('should load default cam when there is no camera device in the cache', fakeAsync(() => {
            localStorageServiceSpy.load.and.callFake(function <T extends Object>(key) {
                if (key === userMediaService.PREFERRED_CAMERA_KEY) {
                    return null as unknown as T;
                }
                if (key === userMediaService.PREFERRED_MICROPHONE_KEY) {
                    return testData.getListOfMicrophones()[0] as unknown as T;
                }
            });

            spyOn<any>(userMediaService, 'setActiveCamera').and.callFake(function () {});
            spyOn<any>(userMediaService, 'loadDefaultCamera').and.callThrough();
            getCameraAndMicrophoneDevicesSubject.next(testData.getListOfDevices());
            flush();
            expect(userMediaService['setActiveCamera']).toHaveBeenCalledOnceWith(testData.getListOfCameras()[0]);
            expect(userMediaService['loadDefaultCamera']).toHaveBeenCalledOnceWith(testData.getListOfDevices());
        }));

        it('should load default cam when the cached device is not available', fakeAsync(() => {
            localStorageServiceSpy.load.and.callFake(function <T extends Object>(key) {
                if (key === userMediaService.PREFERRED_CAMERA_KEY) {
                    return { deviceId: 'invalid ID' } as unknown as T;
                }
                if (key === userMediaService.PREFERRED_MICROPHONE_KEY) {
                    return testData.getListOfMicrophones()[0] as unknown as T;
                }
            });

            spyOn<any>(userMediaService, 'setActiveCamera').and.callFake(function () {});
            spyOn<any>(userMediaService, 'loadDefaultCamera').and.callThrough();
            getCameraAndMicrophoneDevicesSubject.next(testData.getListOfDevices());
            flush();
            expect(userMediaService['setActiveCamera']).toHaveBeenCalledOnceWith(testData.getListOfCameras()[0]);
            expect(userMediaService['loadDefaultCamera']).toHaveBeenCalledOnceWith(testData.getListOfDevices());
        }));

        it('should load default mic when there is no camera device in the cache', fakeAsync(() => {
            localStorageServiceSpy.load.and.callFake(function <T extends Object>(key) {
                if (key === userMediaService.PREFERRED_CAMERA_KEY) {
                    return testData.getListOfCameras()[0] as unknown as T;
                }
                if (key === userMediaService.PREFERRED_MICROPHONE_KEY) {
                    return null as unknown as T;
                }
            });

            spyOn<any>(userMediaService, 'setActiveMicrophone').and.callFake(function () {});
            spyOn<any>(userMediaService, 'loadDefaultMicrophone').and.callThrough();
            getCameraAndMicrophoneDevicesSubject.next(testData.getListOfDevices());
            flush();
            expect(userMediaService['setActiveMicrophone']).toHaveBeenCalledOnceWith(testData.getListOfMicrophones()[0]);
            expect(userMediaService['loadDefaultMicrophone']).toHaveBeenCalledOnceWith(testData.getListOfDevices());
        }));

        it('should load default mic when the cached device is not available', fakeAsync(() => {
            localStorageServiceSpy.load.and.callFake(function <T extends Object>(key) {
                if (key === userMediaService.PREFERRED_CAMERA_KEY) {
                    return testData.getListOfCameras()[0] as unknown as T;
                }
                if (key === userMediaService.PREFERRED_MICROPHONE_KEY) {
                    return { deviceId: 'invalid ID' } as unknown as T;
                }
            });

            spyOn<any>(userMediaService, 'setActiveMicrophone').and.callFake(function () {});
            spyOn<any>(userMediaService, 'loadDefaultMicrophone').and.callThrough();
            getCameraAndMicrophoneDevicesSubject.next(testData.getListOfDevices());
            flush();
            expect(userMediaService['setActiveMicrophone']).toHaveBeenCalledOnceWith(testData.getListOfMicrophones()[0]);
            expect(userMediaService['loadDefaultMicrophone']).toHaveBeenCalledOnceWith(testData.getListOfDevices());
        }));
    });

    describe('getConferenceSetting', () => {
        it('should return conference setting if one is present', () => {
            const conferenceId = 'conferenceId';
            const startWithAudioMuted = true;
            const conferences = [new ConferenceSetting(conferenceId, startWithAudioMuted), new ConferenceSetting('conferenceId2', true)];
            localStorageServiceSpy.load.and.returnValue(conferences);
            expect(userMediaService.getConferenceSetting(conferenceId)).toEqual(conferences.find(x => x.conferenceId === conferenceId));
        });

        it('should return null if one does not exist', () => {
            localStorageServiceSpy.load.and.returnValue(null);
            expect(userMediaService.getConferenceSetting('conferenceId')).toBeNull();
        });
    });

    describe('updateStartWithAudioMuted', () => {
        it('should save to local storage when conference does not already exist', () => {
            const conferenceId = 'conferenceId';
            localStorageServiceSpy.load.and.returnValue(null);
            userMediaService.updateStartWithAudioMuted(conferenceId, true);
            expect(localStorageServiceSpy.save).toHaveBeenCalledWith(
                userMediaService.CONFERENCES_KEY,
                jasmine.arrayContaining([
                    jasmine.objectContaining({
                        conferenceId: conferenceId,
                        startWithAudioMuted: true
                    })
                ])
            );
        });

        it('should not insert into local storage when startWithAudioMuted is false', () => {
            const conferenceId = 'conferenceId';
            localStorageServiceSpy.load.and.returnValue(null);
            userMediaService.updateStartWithAudioMuted(conferenceId, false);
            expect(localStorageServiceSpy.save).not.toHaveBeenCalled();
        });

        it('should remove existing setting when updating startWithAudioMuted from true to false', () => {
            const conferenceIdToRemove = 'conferenceIdToRemove';
            const conferences = [new ConferenceSetting(conferenceIdToRemove, true), new ConferenceSetting('conferenceId2', true)];
            localStorageServiceSpy.load.and.returnValue(conferences);
            userMediaService.updateStartWithAudioMuted(conferenceIdToRemove, false);
            const expectedConferences = conferences.filter(x => x.conferenceId !== conferenceIdToRemove);
            expect(localStorageServiceSpy.save).toHaveBeenCalledWith(userMediaService.CONFERENCES_KEY, expectedConferences);
        });
    });

    describe('removeExpiredConferenceSettings', () => {
        it('should remove expired conference settings', () => {
            const expiredConferenceSettings: ConferenceSetting[] = [
                new ConferenceSetting('conferenceId1', true, new Date(2020, 1, 1, 8, 0, 0)),
                new ConferenceSetting('conferenceId2', false, new Date(2020, 1, 2, 8, 0, 0))
            ];
            const nonExpiredConferenceSettings: ConferenceSetting[] = [new ConferenceSetting('conferenceId3', true, new Date())];
            const conferenceSettings = [...expiredConferenceSettings, ...nonExpiredConferenceSettings];
            localStorageServiceSpy.load.and.returnValue(conferenceSettings);
            userMediaService.removeExpiredConferenceSettings();
            expect(localStorageServiceSpy.save).toHaveBeenCalledWith(userMediaService.CONFERENCES_KEY, nonExpiredConferenceSettings);
        });

        it('should not remove when no conference settings exist', () => {
            localStorageServiceSpy.load.and.returnValue(null);
            expect(localStorageServiceSpy.save).not.toHaveBeenCalled();
        });
    });
});
