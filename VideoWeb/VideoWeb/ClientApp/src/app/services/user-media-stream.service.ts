import { Injectable } from '@angular/core';
import 'webrtc-adapter';
import { UserMediaDevice } from '../shared/models/user-media-device';
import { Logger } from './logging/logger-base';
import { Observable, ReplaySubject, Subject, zip } from 'rxjs';
import { UserMediaService } from './user-media.service';
import { take } from 'rxjs/operators';
import { MediaServiceService } from './media-service.service';

export const mustProvideAMicrophoneDeviceError = () => new Error('A microphone device must be provided');

@Injectable({
    providedIn: 'root'
})
export class UserMediaStreamService {
    private readonly loggerPrefix = '[UserMediaStreamService] -';

    private currentStream: MediaStream;
    private activateCameraStream: MediaStream;
    private activateMicrophoneStream: MediaStream;

    private currentStreamSubject = new ReplaySubject<MediaStream>(1);
    get currentStream$() {
        return this.currentStreamSubject.asObservable();
    }

    private streamModifiedSubject = new Subject<void>();
    get streamModified$() {
        return this.streamModifiedSubject.asObservable();
    }

    constructor(private logger: Logger, private userMediaService: UserMediaService, private mediaStreamService: MediaServiceService) {
        this.logger.debug(
            `${this.loggerPrefix} Constructor called. Attempting to get active devices from userMediaService to initialise the stream.`
        );
        zip(userMediaService.activeVideoDevice$, userMediaService.activeMicrophoneDevice$)
            .pipe(take(1))
            .subscribe(activeDevices => {
                this.initialiseCurrentStream(activeDevices[0], activeDevices[1]);
            });
    }

    private initialiseCurrentStream(cameraDevice: UserMediaDevice, microphoneDevice: UserMediaDevice) {
        this.logger.debug(`${this.loggerPrefix} Initialising initial stream`, { mic: microphoneDevice, cam: cameraDevice });
        this.mediaStreamService
            .getStreamForCam(cameraDevice)
            .pipe(take(1))
            .subscribe(cameraStream => {
                this.logger.debug(`${this.loggerPrefix} Got camera stream`, { cam: cameraDevice, stream: cameraStream });

                this.currentStream = this.mediaStreamService.initialiseNewStream(cameraStream.getTracks());
                this.activateCameraStream = cameraStream;

                this.mediaStreamService
                    .getStreamForMic(microphoneDevice)
                    .pipe(take(1))
                    .subscribe(microphoneStream => {
                        this.logger.debug(`${this.loggerPrefix} Got microphone stream`, {
                            mic: microphoneDevice,
                            stream: microphoneStream
                        });

                        microphoneStream.getTracks().forEach(track => {
                            this.currentStream.addTrack(track);
                        });

                        this.activateMicrophoneStream = microphoneStream;
                        this.currentStreamSubject.next(this.currentStream);

                        this.logger.info(`${this.loggerPrefix} Built initial stream`, {
                            mic: microphoneDevice,
                            cam: cameraDevice,
                            stream: this.currentStream
                        });

                        this.logger.debug(`${this.loggerPrefix} Subscribing to active video and microphone device changes`);
                        this.userMediaService.activeVideoDevice$.subscribe(videoDevice => {
                            this.onActiveCameraChanged(videoDevice);
                        });

                        this.userMediaService.activeMicrophoneDevice$.subscribe(microphoneDevice => {
                            this.onActiveMicrophoneChanged(microphoneDevice);
                        });
                    });
            });
    }

    private onActiveCameraChanged(cameraDevice: UserMediaDevice) {
        this.logger.debug(`${this.loggerPrefix} active camera changed. Fetching stream for the new device.`, {
            newCam: cameraDevice,
            oldMicStream: this.activateCameraStream
        });

        this.mediaStreamService
            .getStreamForCam(cameraDevice)
            .pipe(take(1))
            .subscribe(cameraStream => {
                this.logger.debug(`${this.loggerPrefix} Got camera stream`, {
                    newCam: cameraDevice,
                    newCamStream: cameraStream,
                    oldCamStream: this.activateCameraStream
                });

                this.activateCameraStream?.getTracks().forEach(track => {
                    this.currentStream.removeTrack(track);
                    track.stop();

                    this.logger.debug(`${this.loggerPrefix} cam changed. Removed and stopped track`, {
                        track: track
                    });
                });

                cameraStream?.getTracks().forEach(track => {
                    this.currentStream.addTrack(track);

                    this.logger.debug(`${this.loggerPrefix} cam changed. Added track`, {
                        track: track
                    });
                });

                this.activateCameraStream = cameraStream;
                this.streamModifiedSubject.next();

                this.logger.info(`${this.loggerPrefix} Updated active camera for current stream`, {
                    activeCamStream: this.activateCameraStream,
                    currentStream: this.currentStream
                });
            });
    }

    private onActiveMicrophoneChanged(microphoneDevice: UserMediaDevice) {
        this.logger.debug(`${this.loggerPrefix} active microphone changed. Fetching stream for the new device.`, {
            newMic: microphoneDevice,
            oldMicStream: this.activateMicrophoneStream
        });

        if (!microphoneDevice) {
            this.logger.warn(`${this.loggerPrefix} must provide a microphone device`);
            throw mustProvideAMicrophoneDeviceError();
        }

        this.mediaStreamService
            .getStreamForMic(microphoneDevice)
            .pipe(take(1))
            .subscribe(microphoneStream => {
                this.logger.debug(`${this.loggerPrefix} Got microphone stream`, {
                    newCam: microphoneDevice,
                    newCamStream: microphoneStream,
                    oldCamStream: this.activateMicrophoneStream
                });

                this.activateMicrophoneStream?.getTracks().forEach(track => {
                    this.currentStream.removeTrack(track);
                    track.stop();

                    this.logger.debug(`${this.loggerPrefix} mic changed. Removed and stopped track`, {
                        track: track
                    });
                });

                microphoneStream.getTracks().forEach(track => {
                    this.currentStream.addTrack(track);

                    this.logger.debug(`${this.loggerPrefix} mic changed. Added track`, {
                        track: track
                    });
                });

                this.activateMicrophoneStream = microphoneStream;
                this.streamModifiedSubject.next();

                this.logger.info(`${this.loggerPrefix} Updated active microphone for current stream`, {
                    activeMicStream: this.activateMicrophoneStream,
                    currentStream: this.currentStream
                });
            });
    }

    getStreamForMic(device: UserMediaDevice): Observable<MediaStream> {
        throw new Error('TEMPORARY');
    }

    getStreamForCam(device: UserMediaDevice): Observable<MediaStream> {
        throw new Error('TEMPORARY');
    }

    stopStream(stream: MediaStream) {
        throw new Error('TEMPORARY');
    }
}
