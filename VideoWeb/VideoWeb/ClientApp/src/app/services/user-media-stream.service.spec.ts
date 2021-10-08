import { fakeAsync, flush } from '@angular/core/testing';
import { Guid } from 'guid-typescript';
import { of, ReplaySubject, Subject } from 'rxjs';
import { getSpiedPropertyGetter } from '../shared/jasmine-helpers/property-helpers';
import { UserMediaDevice } from '../shared/models/user-media-device';
import { AudioOnlyImageServiceService as AudioOnlyImageService } from './audio-only-image-service.service';
import { mustProvideAMicrophoneDeviceError } from './errors/must-provide-a-microphone-device.error';
import { Logger } from './logging/logger-base';
import { MediaStreamService } from './media-stream.service';
import { UserMediaStreamService } from './user-media-stream.service';
import { UserMediaService } from './user-media.service';

describe('UserMediaStreamService', () => {
    const mediaStreamBuilder = (device: UserMediaDevice) => {
        const stream = jasmine.createSpyObj<MediaStream>(['addTrack', 'removeTrack', 'getTracks', 'getVideoTracks', 'getAudioTracks']);
        const track = jasmine.createSpyObj<MediaStreamTrack>(['stop'], ['label', 'id']);

        getSpiedPropertyGetter(track, 'label').and.returnValue(device.label);
        getSpiedPropertyGetter(track, 'id').and.returnValue(Guid.create().toString());

        stream.getTracks.and.returnValue([track]);
        stream.getVideoTracks.and.returnValue([track]);
        stream.getAudioTracks.and.returnValue([track]);

        return stream;
    };

    const cameraOneDevice = new UserMediaDevice('Camera 1', Guid.create().toString(), 'videoinput', '');
    const cameraOneStream = mediaStreamBuilder(cameraOneDevice);

    const audioOnlyImageDevice = new UserMediaDevice('Audio Only', Guid.create().toString(), 'videoinput', '');
    const audioOnlyImageStream = mediaStreamBuilder(audioOnlyImageDevice);

    const cameraTwoDevice = new UserMediaDevice('Camera 2', Guid.create().toString(), 'videoinput', '');
    const cameraTwoStream = mediaStreamBuilder(cameraTwoDevice);

    const microphoneOneDevice = new UserMediaDevice('Microphone 1', Guid.create().toString(), 'audioinput', '');
    const microphoneOneStream = mediaStreamBuilder(microphoneOneDevice);

    const microphoneTwoDevice = new UserMediaDevice('Microphone 2', Guid.create().toString(), 'audioinput', '');
    const microphoneTwoStream = mediaStreamBuilder(microphoneTwoDevice);

    let sut: UserMediaStreamService;

    let loggerSpy: jasmine.SpyObj<Logger>;

    let activeCameraDeviceSubject: ReplaySubject<UserMediaDevice>;
    let activeMicrophoneDeviceSubject: ReplaySubject<UserMediaDevice>;
    let isAudioOnlySubject: ReplaySubject<boolean>;
    let userMediaServiceSpy: jasmine.SpyObj<UserMediaService>;
    let audioOnlyImageServiceSpy: jasmine.SpyObj<AudioOnlyImageService>;

    let mediaStreamServiceSpy: jasmine.SpyObj<MediaStreamService>;

    beforeEach(fakeAsync(() => {
        loggerSpy = jasmine.createSpyObj<Logger>(['debug', 'info', 'warn', 'error']);

        activeCameraDeviceSubject = new ReplaySubject<UserMediaDevice>(1);
        activeMicrophoneDeviceSubject = new ReplaySubject<UserMediaDevice>(1);
        isAudioOnlySubject = new ReplaySubject<boolean>(1);
        userMediaServiceSpy = jasmine.createSpyObj<UserMediaService>([], ['isAudioOnly$', 'activeVideoDevice$', 'activeMicrophoneDevice$']);

        getSpiedPropertyGetter(userMediaServiceSpy, 'activeVideoDevice$').and.returnValue(activeCameraDeviceSubject.asObservable());
        getSpiedPropertyGetter(userMediaServiceSpy, 'activeMicrophoneDevice$').and.returnValue(
            activeMicrophoneDeviceSubject.asObservable()
        );
        getSpiedPropertyGetter(userMediaServiceSpy, 'isAudioOnly$').and.returnValue(isAudioOnlySubject.asObservable());

        mediaStreamServiceSpy = jasmine.createSpyObj<MediaStreamService>(['initialiseNewStream', 'getStreamForCam', 'getStreamForMic']);

        const newStreamTracks = [];
        const newStreamSpy = jasmine.createSpyObj<MediaStream>(['addTrack', 'removeTrack', 'getTracks', 'getTrackById']);
        newStreamSpy.addTrack.and.callFake(track => {
            newStreamTracks.push(track);
        });
        newStreamSpy.removeTrack.and.callFake(track => {
            const idx = newStreamTracks.findIndex(existingTrack => existingTrack.id === track.id);
            if (idx < 0) {
                return;
            }
            newStreamTracks.splice(idx, 1);
        });
        newStreamSpy.getTracks.and.returnValue(newStreamTracks);
        newStreamSpy.getTrackById.and.callFake(trackId => newStreamTracks.find(x => x.id === trackId));

        mediaStreamServiceSpy.initialiseNewStream.and.callFake(tracks => {
            newStreamTracks.push(...tracks);
            return newStreamSpy;
        });
        mediaStreamServiceSpy.getStreamForCam.withArgs(cameraOneDevice).and.returnValue(of(cameraOneStream));
        mediaStreamServiceSpy.getStreamForCam.withArgs(cameraTwoDevice).and.returnValue(of(cameraTwoStream));
        mediaStreamServiceSpy.getStreamForMic.withArgs(microphoneOneDevice).and.returnValue(of(microphoneOneStream));
        mediaStreamServiceSpy.getStreamForMic.withArgs(microphoneTwoDevice).and.returnValue(of(microphoneTwoStream));

        audioOnlyImageServiceSpy = jasmine.createSpyObj<AudioOnlyImageService>(['getAudioOnlyImageStream']);

        sut = new UserMediaStreamService(loggerSpy, userMediaServiceSpy, mediaStreamServiceSpy, audioOnlyImageServiceSpy);

        activeCameraDeviceSubject.next(cameraOneDevice);
        activeMicrophoneDeviceSubject.next(microphoneOneDevice);
        flush();
    }));

    describe('initialisation', () => {
        it('should mix the active mic and cam tracks and emit it as the current stream', fakeAsync(() => {
            // Arrange
            const expectedNumberOfTracks = 2;

            // Act
            let currentStream: MediaStream | null = null;
            sut.currentStream$.subscribe(stream => (currentStream = stream));
            flush();

            // Assert
            expect(currentStream).toBeTruthy();

            expect(mediaStreamServiceSpy.getStreamForCam).toHaveBeenCalledWith(cameraOneDevice);
            expect(mediaStreamServiceSpy.getStreamForMic).toHaveBeenCalledWith(microphoneOneDevice);

            const currentStreamTracks = currentStream.getTracks();
            expect(currentStreamTracks).toBeTruthy();
            expect(currentStreamTracks.length).toEqual(expectedNumberOfTracks);
            expect(currentStreamTracks.find(track => track.label === cameraOneDevice.label)).toBeTruthy();
            expect(currentStreamTracks.find(track => track.label === microphoneOneDevice.label)).toBeTruthy();
        }));
    });

    describe('on active camera change', () => {
        it('should add the new tracks to the active stream from the new camera and remove the old tracks from the previously active camera', fakeAsync(() => {
            // Arrange
            const expectedNumberOfTracks = 2;

            // Act
            activeCameraDeviceSubject.next(cameraTwoDevice);
            flush();

            let currentStream: MediaStream | null = null;
            sut.currentStream$.subscribe(stream => (currentStream = stream));
            flush();

            // Assert
            cameraOneStream.getVideoTracks().forEach(track => {
                expect(currentStream.removeTrack).toHaveBeenCalledWith(track);
                expect(track.stop).toHaveBeenCalled();
            });

            expect(mediaStreamServiceSpy.getStreamForCam).toHaveBeenCalledWith(cameraTwoDevice);
            expect(currentStream.addTrack).toHaveBeenCalledWith(cameraTwoStream.getVideoTracks()[0]);

            const currentStreamTracks = currentStream.getTracks();
            expect(currentStreamTracks).toBeTruthy();
            expect(currentStreamTracks.length).toEqual(expectedNumberOfTracks);
            expect(currentStreamTracks.find(track => track.label === cameraOneDevice.label)).toBeFalsy();
            expect(currentStreamTracks.find(track => track.label === cameraTwoDevice.label)).toBeTruthy();
            expect(currentStreamTracks.find(track => track.label === microphoneOneDevice.label)).toBeTruthy();
        }));

        it('should NOT add the new tracks to the active stream from the new camera when it is audio only', fakeAsync(() => {
            // Arrange
            const expectedNumberOfTracks = 1; // Only audio track
            isAudioOnlySubject.next(true);
            flush();

            // Act
            activeCameraDeviceSubject.next(cameraTwoDevice);
            flush();

            let currentStream: MediaStream | null = null;
            sut.currentStream$.subscribe(stream => (currentStream = stream));
            flush();

            // Assert
            expect(mediaStreamServiceSpy.getStreamForCam).toHaveBeenCalledWith(cameraTwoDevice);
            cameraOneStream.getVideoTracks().forEach(track => {
                expect(currentStream.removeTrack).toHaveBeenCalledWith(track);
                expect(track.stop).toHaveBeenCalled();
            });

            const currentStreamTracks = currentStream.getTracks();
            expect(currentStreamTracks).toBeTruthy();
            expect(currentStreamTracks.length).toEqual(expectedNumberOfTracks);
            expect(currentStreamTracks.find(track => track.label === cameraOneDevice.label)).toBeFalsy();
            expect(currentStreamTracks.find(track => track.label === cameraTwoDevice.label)).toBeFalsy();
            expect(currentStreamTracks.find(track => track.label === microphoneOneDevice.label)).toBeTruthy();
        }));

        it('should emit the stream modified event', fakeAsync(() => {
            // Act
            let wasModified = false;
            sut.streamModified$.subscribe(() => (wasModified = true));

            activeCameraDeviceSubject.next(cameraTwoDevice);
            flush();

            // Assert
            expect(wasModified).toBeTrue();
        }));

        it('should emit the active camera stream', fakeAsync(() => {
            // Act
            let stream: MediaStream | null;
            sut.activeCameraStream$.subscribe(result => (stream = result));

            activeCameraDeviceSubject.next(cameraTwoDevice);
            flush();

            // Assert
            expect(stream).toBe(cameraTwoStream);
        }));

        it('should emit the active microphone stream', fakeAsync(() => {
            // Act
            let stream: MediaStream | null;
            sut.activeMicrophoneStream$.subscribe(result => (stream = result));

            activeMicrophoneDeviceSubject.next(microphoneTwoDevice);
            flush();

            // Assert
            expect(stream).toBe(microphoneTwoStream);
        }));
    });

    describe('on active camera change during audio only; then audio only is turned off', () => {
        it('should add the tracks for the new active camera when audio only is turned off', fakeAsync(() => {
            // Arrange
            const expectedNumberOfTracks = 2;
            isAudioOnlySubject.next(true);
            flush();

            // Act
            let currentStream: MediaStream | null = null;
            sut.currentStream$.subscribe(stream => (currentStream = stream));
            flush();

            activeCameraDeviceSubject.next(cameraTwoDevice);
            flush();

            isAudioOnlySubject.next(false);
            flush();

            // Assert
            expect(mediaStreamServiceSpy.getStreamForCam).toHaveBeenCalledWith(cameraTwoDevice);
            cameraOneStream.getTracks().forEach(track => {
                expect(currentStream.removeTrack).toHaveBeenCalledWith(track);
                expect(track.stop).toHaveBeenCalled();
            });

            const currentStreamTracks = currentStream.getTracks();
            expect(currentStreamTracks).toBeTruthy();
            expect(currentStreamTracks.length).toEqual(expectedNumberOfTracks);
            expect(currentStreamTracks.find(track => track.label === cameraOneDevice.label)).toBeFalsy();
            expect(currentStreamTracks.find(track => track.label === cameraTwoDevice.label)).toBeTruthy();
            expect(currentStreamTracks.find(track => track.label === microphoneOneDevice.label)).toBeTruthy();
        }));
    });

    describe('on is audio only changed', () => {
        it('should emit null for the active video stream when audio only', fakeAsync(() => {
            // Act
            let stream: MediaStream | null = new MediaStream();
            sut.activeCameraStream$.subscribe(result => (stream = result));

            isAudioOnlySubject.next(true);
            flush();

            // Assert
            expect(stream).toBeNull();
        }));

        it('should emit stream for the active video stream when NOT audio only', fakeAsync(() => {
            // Act
            let stream: MediaStream | null = null;
            sut.activeCameraStream$.subscribe(result => (stream = result));
            flush();

            isAudioOnlySubject.next(false);
            flush();

            // Assert
            expect(stream).toBe(cameraOneStream);
        }));

        it('should remove the existing tracks for the active video camera when audio only is true', fakeAsync(() => {
            // Arrange
            const expectedNumberOfTracks = 1; // Only audio track

            // Act
            let currentStream: MediaStream | null = null;
            sut.currentStream$.subscribe(stream => (currentStream = stream));
            flush();

            isAudioOnlySubject.next(true);
            flush();

            // Assert
            cameraOneStream.getVideoTracks().forEach(track => {
                expect(currentStream.removeTrack).toHaveBeenCalledWith(track);
                expect(track.stop).toHaveBeenCalled();
            });

            const currentStreamTracks = currentStream.getTracks();
            expect(currentStreamTracks).toBeTruthy();
            expect(currentStreamTracks.length).toEqual(expectedNumberOfTracks);
            expect(currentStreamTracks.find(track => track.label === cameraOneDevice.label)).toBeFalsy();
            expect(currentStreamTracks.find(track => track.label === microphoneOneDevice.label)).toBeTruthy();
        }));

        it('should add the tracks for the active only image stream when audio only is true', fakeAsync(() => {
            // Arrange
            const expectedNumberOfTracks = 2; // Audio track + Audio Only Image Track

            audioOnlyImageServiceSpy.getAudioOnlyImageStream.and.returnValue(audioOnlyImageStream);

            // Act
            let currentStream: MediaStream | null = null;
            sut.currentStream$.subscribe(stream => (currentStream = stream));
            flush();

            isAudioOnlySubject.next(true);
            flush();

            // Assert
            audioOnlyImageStream.getVideoTracks().forEach(track => {
                expect(currentStream.addTrack).toHaveBeenCalledWith(track);
            });

            const currentStreamTracks = currentStream.getTracks();
            expect(currentStreamTracks).toBeTruthy();
            expect(currentStreamTracks.length).toEqual(expectedNumberOfTracks);
            expect(currentStreamTracks.find(track => track.label === audioOnlyImageDevice.label)).toBeTruthy();
            expect(currentStreamTracks.find(track => track.label === microphoneOneDevice.label)).toBeTruthy();
        }));

        it('should add the tracks for the active video camera when audio only is changed back to false', fakeAsync(() => {
            // Arrange
            const expectedNumberOfTracks = 2;

            isAudioOnlySubject.next(true);
            flush();

            // Act
            let currentStream: MediaStream | null = null;
            sut.currentStream$.subscribe(stream => (currentStream = stream));
            flush();

            isAudioOnlySubject.next(false);
            flush();

            // Assert
            cameraOneStream.getVideoTracks().forEach(track => {
                expect(currentStream.addTrack).toHaveBeenCalledWith(track);
            });

            const currentStreamTracks = currentStream.getTracks();
            expect(currentStreamTracks).toBeTruthy();
            expect(currentStreamTracks.length).toEqual(expectedNumberOfTracks);
            expect(currentStreamTracks.find(track => track.label === cameraOneDevice.label)).toBeTruthy();
            expect(currentStreamTracks.find(track => track.label === microphoneOneDevice.label)).toBeTruthy();
        }));

        it('should remove the tracks for the active only image stream when audio only is false', fakeAsync(() => {
            // Arrange
            const expectedNumberOfTracks = 2;

            isAudioOnlySubject.next(true);
            flush();

            // Act
            let currentStream: MediaStream | null = null;
            sut.currentStream$.subscribe(stream => (currentStream = stream));
            flush();

            isAudioOnlySubject.next(false);
            flush();

            // Assert
            audioOnlyImageStream.getVideoTracks().forEach(track => {
                expect(currentStream.removeTrack).toHaveBeenCalledWith(track);
                expect(track.stop).not.toHaveBeenCalled();
            });

            const currentStreamTracks = currentStream.getTracks();
            expect(currentStreamTracks).toBeTruthy();
            expect(currentStreamTracks.length).toEqual(expectedNumberOfTracks);
            expect(currentStreamTracks.find(track => track.label === audioOnlyImageDevice.label)).toBeFalsy();
            expect(currentStreamTracks.find(track => track.label === microphoneOneDevice.label)).toBeTruthy();
        }));
    });

    describe('on active microphone change', () => {
        it('should add the new tracks to the active stream from the new microphone and remove the old tracks from the previously active microphone', fakeAsync(() => {
            // Act
            const expectedNumberOfTracks = 2;
            activeMicrophoneDeviceSubject.next(microphoneTwoDevice);
            flush();

            let currentStream: MediaStream | null = null;
            sut.currentStream$.subscribe(stream => (currentStream = stream));
            flush();

            // Assert
            expect(mediaStreamServiceSpy.getStreamForMic).toHaveBeenCalledWith(microphoneTwoDevice);
            microphoneOneStream.getAudioTracks().forEach(track => {
                expect(currentStream.removeTrack).toHaveBeenCalledWith(track);
                expect(track.stop).toHaveBeenCalled();
            });

            const currentStreamTracks = currentStream.getTracks();
            console.log(currentStreamTracks);
            expect(currentStreamTracks).toBeTruthy();
            expect(currentStreamTracks.length).toEqual(expectedNumberOfTracks);
            expect(currentStreamTracks.find(track => track.label === cameraOneDevice.label)).toBeTruthy();
            expect(currentStreamTracks.find(track => track.label === microphoneOneDevice.label)).toBeFalsy();
            expect(currentStreamTracks.find(track => track.label === microphoneTwoDevice.label)).toBeTruthy();
        }));

        it('should emit the stream modified event', fakeAsync(() => {
            // Act
            let wasModified = false;
            sut.streamModified$.subscribe(() => (wasModified = true));

            activeMicrophoneDeviceSubject.next(microphoneTwoDevice);
            flush();

            // Assert
            expect(wasModified).toBeTrue();
        }));

        it('should throw an error when the new active microphone is null', fakeAsync(() => {
            // Act & Assert
            let wasModified = false;
            sut.streamModified$.subscribe(() => (wasModified = true));

            try {
                activeMicrophoneDeviceSubject.next(null);
                flush();
            } catch (error) {
                expect(error).toEqual(mustProvideAMicrophoneDeviceError());
                expect(wasModified).toBeFalse();
            }
        }));

        it('should throw an error when the new active microphone is undefined', fakeAsync(() => {
            // Act & Assert
            let wasModified = false;
            sut.streamModified$.subscribe(() => (wasModified = true));

            try {
                activeMicrophoneDeviceSubject.next(undefined);
                flush();
            } catch (error) {
                expect(error).toEqual(mustProvideAMicrophoneDeviceError());
                expect(wasModified).toBeFalse();
            }
        }));
    });
});
