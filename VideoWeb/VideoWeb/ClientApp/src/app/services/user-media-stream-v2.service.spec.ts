import { Guid } from 'guid-typescript';
import { getSpiedPropertyGetter } from '../shared/jasmine-helpers/property-helpers';
import { UserMediaDevice } from '../shared/models/user-media-device';
import { UserMediaStreamServiceV2 } from './user-media-stream-v2.service';
import { Logger } from './logging/logger-base';
import { UserMediaService } from './user-media.service';
import { AudioOnlyImageService } from './audio-only-image.service';
import { MediaStreamService } from './media-stream.service';
import { of, ReplaySubject } from 'rxjs';
import { fakeAsync, tick } from '@angular/core/testing';

describe('UserMediaStreamServiceV2', () => {
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

    let cameraOneDevice: UserMediaDevice;
    let cameraOneStream: jasmine.SpyObj<MediaStream>;
    let audioOnlyImageDevice: UserMediaDevice;
    let audioOnlyImageStream: jasmine.SpyObj<MediaStream>;
    let cameraTwoDevice: UserMediaDevice;
    let cameraTwoStream: jasmine.SpyObj<MediaStream>;
    let microphoneOneDevice: UserMediaDevice;
    let microphoneOneStream: jasmine.SpyObj<MediaStream>;
    let microphoneTwoDevice: UserMediaDevice;
    let microphoneTwoStream: jasmine.SpyObj<MediaStream>;

    let emptyStream: MediaStream;
    let combinedStream: MediaStream;

    let loggerSpy: jasmine.SpyObj<Logger>;
    let userMediaServiceSpy: jasmine.SpyObj<UserMediaService>;
    let mediaStreamServiceSpy: jasmine.SpyObj<MediaStreamService>;
    let audioOnlyImageServiceSpy: jasmine.SpyObj<AudioOnlyImageService>;

    let activeCameraDeviceSubject: ReplaySubject<UserMediaDevice>;
    let activeMicrophoneDeviceSubject: ReplaySubject<UserMediaDevice>;
    let isAudioOnlySubject: ReplaySubject<boolean>;

    let sut: UserMediaStreamServiceV2;

    beforeEach(() => {
        cameraOneDevice = new UserMediaDevice('Camera 1', Guid.create().toString(), 'videoinput', '');
        cameraOneStream = mediaStreamBuilder(cameraOneDevice);
        audioOnlyImageDevice = new UserMediaDevice('Audio Only', Guid.create().toString(), 'videoinput', '');
        audioOnlyImageStream = mediaStreamBuilder(audioOnlyImageDevice);
        cameraTwoDevice = new UserMediaDevice('Camera 2', Guid.create().toString(), 'videoinput', '');
        cameraTwoStream = mediaStreamBuilder(cameraTwoDevice);
        microphoneOneDevice = new UserMediaDevice('Microphone 1', Guid.create().toString(), 'audioinput', '');
        microphoneOneStream = mediaStreamBuilder(microphoneOneDevice);
        microphoneTwoDevice = new UserMediaDevice('Microphone 2', Guid.create().toString(), 'audioinput', '');
        microphoneTwoStream = mediaStreamBuilder(microphoneTwoDevice);

        emptyStream = new MediaStream();
        combinedStream = new MediaStream();

        loggerSpy = jasmine.createSpyObj<Logger>(['debug', 'info', 'warn', 'error']);

        activeCameraDeviceSubject = new ReplaySubject<UserMediaDevice>(1);
        activeMicrophoneDeviceSubject = new ReplaySubject<UserMediaDevice>(1);
        isAudioOnlySubject = new ReplaySubject<boolean>(1);
        userMediaServiceSpy = jasmine.createSpyObj<UserMediaService>(
            ['initialise'],
            ['isAudioOnly$', 'activeVideoDevice$', 'activeMicrophoneDevice$']
        );

        getSpiedPropertyGetter(userMediaServiceSpy, 'activeVideoDevice$').and.returnValue(activeCameraDeviceSubject.asObservable());
        getSpiedPropertyGetter(userMediaServiceSpy, 'activeMicrophoneDevice$').and.returnValue(
            activeMicrophoneDeviceSubject.asObservable()
        );
        getSpiedPropertyGetter(userMediaServiceSpy, 'isAudioOnly$').and.returnValue(isAudioOnlySubject.asObservable());

        mediaStreamServiceSpy = jasmine.createSpyObj<MediaStreamService>(['initialiseNewStream', 'getStreamForCam', 'getStreamForMic']);
        mediaStreamServiceSpy.initialiseNewStream.withArgs([]).and.returnValue(emptyStream);
        mediaStreamServiceSpy.getStreamForCam.withArgs(cameraOneDevice).and.returnValue(of(cameraOneStream));
        mediaStreamServiceSpy.getStreamForCam.withArgs(cameraTwoDevice).and.returnValue(of(cameraTwoStream));

        mediaStreamServiceSpy.getStreamForMic.withArgs(microphoneOneDevice).and.returnValue(of(microphoneOneStream));
        mediaStreamServiceSpy.getStreamForMic.withArgs(microphoneTwoDevice).and.returnValue(of(microphoneTwoStream));

        audioOnlyImageServiceSpy = jasmine.createSpyObj<AudioOnlyImageService>(['getAudioOnlyImageStream']);
        audioOnlyImageServiceSpy.getAudioOnlyImageStream.and.returnValue(of(audioOnlyImageStream));

        sut = new UserMediaStreamServiceV2(loggerSpy, userMediaServiceSpy, mediaStreamServiceSpy, audioOnlyImageServiceSpy);
    });

    it('should capture media devices, audio only state and create a stream', fakeAsync(() => {
        activeCameraDeviceSubject.next(cameraOneDevice);
        activeMicrophoneDeviceSubject.next(microphoneOneDevice);

        mediaStreamServiceSpy.initialiseNewStream
            .withArgs([...microphoneOneStream.getAudioTracks(), ...cameraOneStream.getVideoTracks()])
            .and.returnValue(combinedStream);
        isAudioOnlySubject.next(false);

        tick();

        expect(sut.currentStream).toBe(combinedStream);

        expect(mediaStreamServiceSpy.getStreamForCam).toHaveBeenCalledWith(cameraOneDevice);
        expect(mediaStreamServiceSpy.getStreamForMic).toHaveBeenCalledWith(microphoneOneDevice);
        expect(audioOnlyImageServiceSpy.getAudioOnlyImageStream).not.toHaveBeenCalled();

        sut.currentStream$.subscribe(stream => {
            expect(stream).toBe(combinedStream);
        });
    }));

    describe('createAndPublishStream - before values', () => {
        it('should not create if audio only is null and no camera or microphone', fakeAsync(() => {
            activeCameraDeviceSubject.next(null);
            activeMicrophoneDeviceSubject.next(null);
            isAudioOnlySubject.next(null);

            tick();

            expect(sut.currentStream).toBeNull();

            expect(mediaStreamServiceSpy.getStreamForCam).not.toHaveBeenCalled();
            expect(mediaStreamServiceSpy.getStreamForMic).not.toHaveBeenCalled();
            expect(audioOnlyImageServiceSpy.getAudioOnlyImageStream).not.toHaveBeenCalled();

            sut.currentStream$.subscribe(stream => {
                expect(stream).toBeNull();
            });

            sut.isStreamInitialized$.subscribe(isStreamInitialized => {
                expect(isStreamInitialized).toBeFalse();
            });
        }));
    });

    describe('createAndPublishStream', () => {
        it('should republish the same stream if device has not changed and stream is active', () => {
            sut.currentStream = combinedStream;
            sut['deviceChanged'] = false;

            sut.createAndPublishStream();

            expect(sut.currentStream).toBe(combinedStream);

            expect(mediaStreamServiceSpy.getStreamForCam).not.toHaveBeenCalled();
            expect(mediaStreamServiceSpy.getStreamForMic).not.toHaveBeenCalled();
            expect(audioOnlyImageServiceSpy.getAudioOnlyImageStream).not.toHaveBeenCalled();

            sut.currentStream$.subscribe(stream => {
                expect(stream).toBe(combinedStream);
            });
        });
    });

    describe('audioOnly enabled', () => {
        it('should create an audio only stream and no camera image', fakeAsync(() => {
            const audioOnlyStream = new MediaStream();
            mediaStreamServiceSpy.initialiseNewStream
                .withArgs([...microphoneOneStream.getAudioTracks(), ...audioOnlyImageStream.getVideoTracks()])
                .and.returnValue(audioOnlyStream);

            activeCameraDeviceSubject.next(null);
            activeMicrophoneDeviceSubject.next(microphoneOneDevice);
            isAudioOnlySubject.next(true);

            tick();

            expect(sut.currentStream).toBe(audioOnlyStream);

            expect(mediaStreamServiceSpy.getStreamForCam).not.toHaveBeenCalled();
            expect(mediaStreamServiceSpy.getStreamForMic).toHaveBeenCalledWith(microphoneOneDevice);
            expect(audioOnlyImageServiceSpy.getAudioOnlyImageStream).toHaveBeenCalled();

            sut.currentStream$.subscribe(stream => {
                expect(stream).toBe(audioOnlyStream);
            });
        }));

        it('should create a no camera image stream only when no microphone detected', fakeAsync(() => {
            sut.currentStream = combinedStream;

            const imageOnlyStream = new MediaStream();
            mediaStreamServiceSpy.initialiseNewStream
                .withArgs([...emptyStream.getAudioTracks(), ...audioOnlyImageStream.getVideoTracks()])
                .and.returnValue(imageOnlyStream);

            activeCameraDeviceSubject.next(null);
            activeMicrophoneDeviceSubject.next(null);
            isAudioOnlySubject.next(true);

            tick();

            expect(sut.currentStream).toBe(imageOnlyStream);

            expect(mediaStreamServiceSpy.getStreamForCam).not.toHaveBeenCalled();
            expect(mediaStreamServiceSpy.getStreamForMic).not.toHaveBeenCalled();
            expect(audioOnlyImageServiceSpy.getAudioOnlyImageStream).toHaveBeenCalled();

            sut.currentStream$.subscribe(stream => {
                expect(stream).toBe(imageOnlyStream);
            });
        }));
    });

    describe('audioOnly disabled', () => {
        it('should create an empty stream when no camera or microphone detected', fakeAsync(() => {
            activeCameraDeviceSubject.next(null);
            activeMicrophoneDeviceSubject.next(null);
            isAudioOnlySubject.next(false);

            tick();

            expect(sut.currentStream).toBe(emptyStream);

            expect(mediaStreamServiceSpy.getStreamForCam).not.toHaveBeenCalled();
            expect(mediaStreamServiceSpy.getStreamForMic).not.toHaveBeenCalled();
            expect(audioOnlyImageServiceSpy.getAudioOnlyImageStream).not.toHaveBeenCalled();

            sut.currentStream$.subscribe(stream => {
                expect(stream).toBe(emptyStream);
            });
        }));
    });

    describe('closeCurrentStream', () => {
        it('should do nothing is there is no current stream', fakeAsync(() => {
            sut.currentStream = combinedStream;

            sut.closeCurrentStream();
            tick();

            sut.currentStream$.subscribe(stream => {
                expect(stream).toBeNull();
            });

            expect(sut.currentStream).toBeNull();
        }));
    });
});
