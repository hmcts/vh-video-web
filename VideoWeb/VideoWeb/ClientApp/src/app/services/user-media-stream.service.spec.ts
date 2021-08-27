import { fakeAsync, flush } from '@angular/core/testing';
import { Guid } from 'guid-typescript';
import { of, Subject } from 'rxjs';
import { getSpiedPropertyGetter } from '../shared/jasmine-helpers/property-helpers';
import { UserMediaDevice } from '../shared/models/user-media-device';
import { Logger } from './logging/logger-base';
import { MediaStreamService } from './media-stream.service';
import { mustProvideAMicrophoneDeviceError, UserMediaStreamService } from './user-media-stream.service';
import { UserMediaService } from './user-media.service';

describe('UserMediaStreamService', () => {
    let cloneStream: any;
    const mediaStreamBuilder = (device: UserMediaDevice) => {
        const stream = jasmine.createSpyObj<MediaStream>(['addTrack', 'removeTrack', 'getTracks', 'clone']);
        const track = jasmine.createSpyObj<MediaStreamTrack>(['stop'], ['label', 'id']);
        getSpiedPropertyGetter(track, 'label').and.returnValue(device.label);
        getSpiedPropertyGetter(track, 'id').and.returnValue(Guid.create().toString());

        const tracks: any = [track];
        stream.addTrack.and.callFake(x => tracks.push(x));

        stream.removeTrack.and.callFake(x => {
            const idx = tracks.findIndex(existingTrack => existingTrack.id === x.id);
            if (idx < 0) {
                throw new Error(`Cant find track ${track}`);
            }
            tracks.splice(idx, 1);
        });

        stream.getTracks.and.returnValue(tracks);

        stream.clone.and.callFake(() => {
            cloneStream = Object.assign({}, stream);
            return cloneStream;
        });
        return stream;
    };

    const cameraOneDevice = new UserMediaDevice('Camera 1', Guid.create().toString(), 'videoinput', '');
    let cameraOneStream = mediaStreamBuilder(cameraOneDevice);

    const cameraTwoDevice = new UserMediaDevice('Camera 2', Guid.create().toString(), 'videoinput', '');
    let cameraTwoStream = mediaStreamBuilder(cameraTwoDevice);

    const microphoneOneDevice = new UserMediaDevice('Microphone 1', Guid.create().toString(), 'audioinput', '');
    let microphoneOneStream = mediaStreamBuilder(microphoneOneDevice);

    const microphoneTwoDevice = new UserMediaDevice('Microphone 2', Guid.create().toString(), 'audioinput', '');
    let microphoneTwoStream = mediaStreamBuilder(microphoneTwoDevice);

    let sut: UserMediaStreamService;

    let loggerSpy: jasmine.SpyObj<Logger>;

    let activeCameraDeviceSubject: Subject<UserMediaDevice>;
    let activeMicrophoneDeviceSubject: Subject<UserMediaDevice>;
    let isAudioOnlySubject: Subject<boolean>;
    let userMediaServiceSpy: jasmine.SpyObj<UserMediaService>;

    let mediaStreamServiceSpy: jasmine.SpyObj<MediaStreamService>;

    beforeEach(fakeAsync(() => {
        cameraOneStream = mediaStreamBuilder(cameraOneDevice);
        cameraTwoStream = mediaStreamBuilder(cameraTwoDevice);
        microphoneOneStream = mediaStreamBuilder(microphoneOneDevice);
        microphoneTwoStream = mediaStreamBuilder(microphoneTwoDevice);
        loggerSpy = jasmine.createSpyObj<Logger>(['debug', 'info', 'warn', 'error']);

        activeCameraDeviceSubject = new Subject<UserMediaDevice>();
        activeMicrophoneDeviceSubject = new Subject<UserMediaDevice>();
        isAudioOnlySubject = new Subject<boolean>();
        userMediaServiceSpy = jasmine.createSpyObj<UserMediaService>([], ['isAudioOnly$', 'activeVideoDevice$', 'activeMicrophoneDevice$']);

        getSpiedPropertyGetter(userMediaServiceSpy, 'activeVideoDevice$').and.returnValue(activeCameraDeviceSubject.asObservable());
        getSpiedPropertyGetter(userMediaServiceSpy, 'activeMicrophoneDevice$').and.returnValue(
            activeMicrophoneDeviceSubject.asObservable()
        );
        getSpiedPropertyGetter(userMediaServiceSpy, 'isAudioOnly$').and.returnValue(isAudioOnlySubject.asObservable());

        mediaStreamServiceSpy = jasmine.createSpyObj<MediaStreamService>(['initialiseNewStream', 'getStreamForCam', 'getStreamForMic']);

        const newStreamTracks = [];
        const newStreamSpy = jasmine.createSpyObj<MediaStream>(['addTrack', 'removeTrack', 'getTracks']);
        newStreamSpy.addTrack.and.callFake(track => newStreamTracks.push(track));
        newStreamSpy.removeTrack.and.callFake(track => {
            const idx = newStreamTracks.findIndex(existingTrack => existingTrack.id === track.id);
            if (idx < 0) {
                throw new Error(`Cant find track ${track}`);
            }
            newStreamTracks.splice(idx, 1);
        });
        newStreamSpy.getTracks.and.returnValue(newStreamTracks);

        mediaStreamServiceSpy.initialiseNewStream.and.callFake(tracks => {
            newStreamTracks.push(...tracks);
            return newStreamSpy;
        });
        mediaStreamServiceSpy.getStreamForCam.withArgs(cameraOneDevice).and.returnValue(of(cameraOneStream));
        mediaStreamServiceSpy.getStreamForCam.withArgs(cameraTwoDevice).and.returnValue(of(cameraTwoStream));
        mediaStreamServiceSpy.getStreamForMic.withArgs(microphoneOneDevice).and.returnValue(of(microphoneOneStream));
        mediaStreamServiceSpy.getStreamForMic.withArgs(microphoneTwoDevice).and.returnValue(of(microphoneTwoStream));

        sut = new UserMediaStreamService(loggerSpy, userMediaServiceSpy, mediaStreamServiceSpy);

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
            expect(mediaStreamServiceSpy.getStreamForCam).toHaveBeenCalledWith(cameraTwoDevice);

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

            const currentStreamTracks = currentStream.getTracks();
            console.log(currentStreamTracks);
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

            const currentStreamTracks = currentStream.getTracks();
            expect(currentStreamTracks).toBeTruthy();
            expect(currentStreamTracks.length).toEqual(expectedNumberOfTracks);
            expect(currentStreamTracks.find(track => track.label === cameraOneDevice.label)).toBeFalsy();
            expect(currentStreamTracks.find(track => track.label === cameraTwoDevice.label)).toBeTruthy();
            expect(currentStreamTracks.find(track => track.label === microphoneOneDevice.label)).toBeTruthy();
        }));
    });

    describe('on is audio only changed', () => {
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
            const currentStreamTracks = currentStream.getTracks();
            expect(currentStreamTracks).toBeTruthy();
            expect(currentStreamTracks.length).toEqual(expectedNumberOfTracks);
            expect(currentStreamTracks.find(track => track.label === cameraOneDevice.label)).toBeFalsy();
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
