import { fakeAsync, flush } from '@angular/core/testing';
import { Guid } from 'guid-typescript';
import { getSpiedPropertyGetter } from '../shared/jasmine-helpers/property-helpers';
import { UserMediaDevice } from '../shared/models/user-media-device';
import { ErrorService } from './error.service';
import { Logger } from './logging/logger-base';
import { MediaStreamService } from './media-stream.service';
import { VideoFilterService } from './video-filter.service';

describe('MediaStreamService', () => {
    const cameraDevice = new UserMediaDevice('Camera 1', Guid.create().toString(), 'videoinput', '');
    const cameraConstraintBuilder = (device: UserMediaDevice) => {
        return {
            video: {
                deviceId: {
                    exact: device.deviceId
                }
            }
        } as MediaStreamConstraints;
    };

    const microphoneDevice = new UserMediaDevice('Microphone 1', Guid.create().toString(), 'audioinput', '');
    const microphoneConstraintBuilder = (device: UserMediaDevice) => {
        return {
            audio: {
                deviceId: {
                    exact: device.deviceId
                }
            }
        } as MediaStreamConstraints;
    };

    let sut: MediaStreamService;

    let loggerSpy: jasmine.SpyObj<Logger>;
    let errorServiceSpy: jasmine.SpyObj<ErrorService>;
    let mediaDevicesSpy: jasmine.SpyObj<MediaDevices>;
    let navigatorSpy: jasmine.SpyObj<Navigator>;
    let videoFilterStreamServiceSpy: jasmine.SpyObj<VideoFilterService>;
    let filterStream: jasmine.SpyObj<MediaStream>;

    beforeEach(() => {
        loggerSpy = jasmine.createSpyObj<Logger>(['info', 'error']);
        errorServiceSpy = jasmine.createSpyObj<ErrorService>(['handlePexipError']);
        mediaDevicesSpy = jasmine.createSpyObj<MediaDevices>(['getUserMedia']);
        navigatorSpy = jasmine.createSpyObj<Navigator>([], ['mediaDevices']);
        getSpiedPropertyGetter(navigatorSpy, 'mediaDevices').and.returnValue(mediaDevicesSpy);

        videoFilterStreamServiceSpy = jasmine.createSpyObj<VideoFilterService>([
            'initFilterFromMediaStream',
            'startFilteredStream',
            'doesSupportVideoFiltering'
        ]);
        const filterStreamTracks = [];
        filterStreamTracks.push(
            jasmine.createSpyObj<MediaStreamTrack>(['stop'])
        );
        filterStreamTracks.push(
            jasmine.createSpyObj<MediaStreamTrack>(['stop'])
        );
        filterStream = jasmine.createSpyObj<MediaStream>(['getTracks']);
        filterStream.getTracks.and.returnValue(filterStreamTracks);

        videoFilterStreamServiceSpy.startFilteredStream.and.returnValue(filterStream);
        videoFilterStreamServiceSpy.doesSupportVideoFiltering.and.returnValue(true);

        sut = new MediaStreamService(loggerSpy, errorServiceSpy, navigatorSpy, videoFilterStreamServiceSpy);
    });

    describe('initialiseNewStream', () => {
        let mediaStreamConstructorSpy;
        beforeEach(() => {
            mediaStreamConstructorSpy = spyOn(window, 'MediaStream');
        });

        it('should call the constructor for media stream and pass the tracks when they are provided', () => {
            // Arrange
            const tracks = [];
            tracks.push(
                jasmine.createSpyObj<MediaStreamTrack>(['stop'])
            );
            tracks.push(
                jasmine.createSpyObj<MediaStreamTrack>(['stop'])
            );
            tracks.push(
                jasmine.createSpyObj<MediaStreamTrack>(['stop'])
            );

            // Act
            sut.initialiseNewStream(tracks);

            // Assert
            expect(mediaStreamConstructorSpy).toHaveBeenCalledOnceWith(tracks);
        });

        it('should call the constructor for media stream and pass undifined when the tracks are NOT provided', () => {
            // Act
            sut.initialiseNewStream();

            // Assert
            expect(mediaStreamConstructorSpy).toHaveBeenCalledOnceWith(undefined);
        });
    });

    describe('getStreamForMic', () => {
        it('should return a promise from getUserMedia', fakeAsync(() => {
            // Arrange
            const expectedStream = new MediaStream();
            const expectedStreamClone = spyOn(expectedStream, 'clone');
            expectedStreamClone.and.returnValue(expectedStream);

            mediaDevicesSpy.getUserMedia.and.resolveTo(expectedStream);

            // Act
            let resultantStream = null;
            sut.getStreamForMic(microphoneDevice).subscribe(stream => (resultantStream = stream));
            flush();

            // Assert
            expect(mediaDevicesSpy.getUserMedia).toHaveBeenCalledWith(microphoneConstraintBuilder(microphoneDevice));

            expect(resultantStream).toBe(expectedStream);
            expect(expectedStreamClone).toHaveBeenCalledTimes(1);
            expect(errorServiceSpy.handlePexipError).not.toHaveBeenCalled();
        }));

        it('should catch any errors and raise this with the error service', fakeAsync(() => {
            // Arrange
            mediaDevicesSpy.getUserMedia.and.rejectWith(new Error());

            // Act
            let resultantStream;
            sut.getStreamForMic(microphoneDevice).subscribe(stream => (resultantStream = stream));
            flush();

            // Assert
            expect(mediaDevicesSpy.getUserMedia).toHaveBeenCalledWith(microphoneConstraintBuilder(microphoneDevice));

            expect(resultantStream).toBeNull();
            expect(errorServiceSpy.handlePexipError).toHaveBeenCalledTimes(1);
        }));
    });

    describe('getStreamForCam', () => {
        it('should return a promise from getUserMedia', fakeAsync(() => {
            // Arrange
            const expectedStream = new MediaStream();
            const expectedStreamClone = spyOn(expectedStream, 'clone');
            expectedStreamClone.and.returnValue(expectedStream);
            mediaDevicesSpy.getUserMedia.and.resolveTo(expectedStream);

            // Act
            let resultantStream = null;
            sut.getStreamForCam(cameraDevice).subscribe(stream => (resultantStream = stream));
            flush();

            // Assert
            expect(mediaDevicesSpy.getUserMedia).toHaveBeenCalledWith(cameraConstraintBuilder(cameraDevice));

            expect(resultantStream).toBe(filterStream);
            expect(expectedStreamClone).toHaveBeenCalledTimes(1);
            expect(errorServiceSpy.handlePexipError).not.toHaveBeenCalled();
        }));

        it('should catch any errors and raise this with the error service', fakeAsync(() => {
            // Arrange
            mediaDevicesSpy.getUserMedia.and.rejectWith(new Error());

            // Act
            let resultantStream;
            sut.getStreamForCam(cameraDevice).subscribe(stream => (resultantStream = stream));
            flush();

            // Assert
            expect(mediaDevicesSpy.getUserMedia).toHaveBeenCalledWith(cameraConstraintBuilder(cameraDevice));

            expect(resultantStream).toBeNull();
            expect(errorServiceSpy.handlePexipError).toHaveBeenCalledTimes(1);
        }));
    });

    describe('stopStream', () => {
        it('should call stop on all tracks', () => {
            // Arrange
            const tracks = [];
            tracks.push(
                jasmine.createSpyObj<MediaStreamTrack>(['stop'])
            );
            tracks.push(
                jasmine.createSpyObj<MediaStreamTrack>(['stop'])
            );
            tracks.push(
                jasmine.createSpyObj<MediaStreamTrack>(['stop'])
            );

            const mediaStreamSpy = jasmine.createSpyObj<MediaStream>(['getTracks']);
            mediaStreamSpy.getTracks.and.returnValue(tracks);

            // Act
            sut.stopStream(mediaStreamSpy);

            // Assert
            tracks.forEach(track => expect(track.stop).toHaveBeenCalledTimes(1));
        });

        it('should do nothing if the stream is null', () => {
            // Act
            sut.stopStream(null);

            // Assert
            expect(sut).toBeTruthy();
        });

        it('should do nothing if the stream is undefined', () => {
            // Act
            sut.stopStream(undefined);

            // Assert
            expect(sut).toBeTruthy();
        });
    });
});
