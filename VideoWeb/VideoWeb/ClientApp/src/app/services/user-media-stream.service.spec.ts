import { fakeAsync, flush } from '@angular/core/testing';
import { Guid } from 'guid-typescript';
import { of, Subject } from 'rxjs';
import { getSpiedPropertyGetter } from '../shared/jasmine-helpers/property-helpers';
import { UserMediaDevice } from '../shared/models/user-media-device';
import { Logger } from './logging/logger-base';
import { MediaServiceService } from './media-service.service';
import { mustProvideAMicrophoneDeviceError, UserMediaStreamService } from './user-media-stream.service';
import { UserMediaService } from './user-media.service';

fdescribe('UserMediaStreamService', () => {
    const mediaStreamBuilder = (device: UserMediaDevice) => {
        const stream = jasmine.createSpyObj<MediaStream>(['addTrack', 'removeTrack', 'getTracks']);
        const track = jasmine.createSpyObj<MediaStreamTrack>(['stop'], ['label', 'id']);

        getSpiedPropertyGetter(track, 'label').and.returnValue(device.label);
        getSpiedPropertyGetter(track, 'id').and.returnValue(Guid.create().toString());

        stream.getTracks.and.returnValue([track]);

        return stream;
    };

    const cameraOneDevice = new UserMediaDevice('Camera 1', Guid.create().toString(), 'videoinput', '');
    const cameraOneStream = mediaStreamBuilder(cameraOneDevice);

    const cameraTwoDevice = new UserMediaDevice('Camera 2', Guid.create().toString(), 'videoinput', '');
    const cameraTwoStream = mediaStreamBuilder(cameraTwoDevice);

    const microphoneOneDevice = new UserMediaDevice('Microphone 1', Guid.create().toString(), 'audioinput', '');
    const microphoneOneStream = mediaStreamBuilder(microphoneOneDevice);

    const microphoneTwoDevice = new UserMediaDevice('Microphone 2', Guid.create().toString(), 'audioinput', '');
    const microphoneTwoStream = mediaStreamBuilder(microphoneTwoDevice);

    let sut: UserMediaStreamService;

    let loggerSpy: jasmine.SpyObj<Logger>;

    let activeCameraDeviceSubject: Subject<UserMediaDevice>;
    let activeMicrophoneDeviceSubject: Subject<UserMediaDevice>;
    let userMediaServiceSpy: jasmine.SpyObj<UserMediaService>;

    let mediaStreamServiceSpy: jasmine.SpyObj<MediaServiceService>;

    beforeEach(fakeAsync(() => {
        loggerSpy = jasmine.createSpyObj<Logger>(['debug', 'info', 'warn', 'error']);

        activeCameraDeviceSubject = new Subject<UserMediaDevice>();
        activeMicrophoneDeviceSubject = new Subject<UserMediaDevice>();
        userMediaServiceSpy = jasmine.createSpyObj<UserMediaService>([], ['activeVideoDevice$', 'activeMicrophoneDevice$']);

        getSpiedPropertyGetter(userMediaServiceSpy, 'activeVideoDevice$').and.returnValue(activeCameraDeviceSubject.asObservable());
        getSpiedPropertyGetter(userMediaServiceSpy, 'activeMicrophoneDevice$').and.returnValue(
            activeMicrophoneDeviceSubject.asObservable()
        );

        mediaStreamServiceSpy = jasmine.createSpyObj<MediaServiceService>(['initialiseNewStream', 'getStreamForCam', 'getStreamForMic']);

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
            // Act
            const expectedNumberOfTracks = 2;
            activeCameraDeviceSubject.next(cameraTwoDevice);
            flush();

            let currentStream: MediaStream | null = null;
            sut.currentStream$.subscribe(stream => (currentStream = stream));
            flush();

            // Assert
            expect(mediaStreamServiceSpy.getStreamForCam).toHaveBeenCalledWith(cameraTwoDevice);
            cameraOneStream.getTracks().forEach(track => {
                expect(currentStream.removeTrack).toHaveBeenCalledWith(track);
                expect(track.stop).toHaveBeenCalled();
            });

            const currentStreamTracks = currentStream.getTracks();
            console.log(currentStreamTracks);
            expect(currentStreamTracks).toBeTruthy();
            expect(currentStreamTracks.length).toEqual(expectedNumberOfTracks);
            expect(currentStreamTracks.find(track => track.label === cameraOneDevice.label)).toBeFalsy();
            expect(currentStreamTracks.find(track => track.label === cameraTwoDevice.label)).toBeTruthy();
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
            microphoneOneStream.getTracks().forEach(track => {
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
