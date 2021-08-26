import { Injectable } from '@angular/core';
import 'webrtc-adapter';
import { UserMediaDevice } from '../shared/models/user-media-device';
import { Logger } from './logging/logger-base';
import { ReplaySubject, Subject, zip } from 'rxjs';
import { UserMediaService } from './user-media.service';
import { take } from 'rxjs/operators';
import { MediaStreamService } from './media-stream.service';

export const mustProvideAMicrophoneDeviceError = () => new Error('A microphone device must be provided');

@Injectable({
    providedIn: 'root'
})
export class UserMediaStreamService {
    private readonly loggerPrefix = '[UserMediaStreamService] -';

    private currentStream: MediaStream;
    private activeCameraStream: MediaStream;
    private activeMicrophoneStream: MediaStream;
    private isAudioOnly = false;

    private currentStreamSubject = new ReplaySubject<MediaStream>(1);
    get currentStream$() {
        return this.currentStreamSubject.asObservable();
    }

    private streamModifiedSubject = new Subject<void>();
    get streamModified$() {
        return this.streamModifiedSubject.asObservable();
    }

    constructor(private logger: Logger, private userMediaService: UserMediaService, private mediaStreamService: MediaStreamService) {
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
                this.logger.debug(`${this.loggerPrefix} Got camera stream`, {
                    cam: cameraDevice,
                    stream: cameraStream,
                    isAudioOnly: this.isAudioOnly
                });

                this.currentStream = cameraStream;
                this.activeCameraStream = cameraStream;

                this.mediaStreamService
                    .getStreamForMic(microphoneDevice)
                    .pipe(take(1))
                    .subscribe(microphoneStream => {
                        this.logger.debug(`${this.loggerPrefix} Got microphone stream`, {
                            mic: microphoneDevice,
                            stream: microphoneStream,
                            isAudioOnly: this.isAudioOnly
                        });

                        microphoneStream.getTracks().forEach(track => {
                            this.currentStream.addTrack(track);
                        });

                        this.activeMicrophoneStream = microphoneStream;
                        this.currentStreamSubject.next(this.currentStream);

                        this.logger.info(`${this.loggerPrefix} Built initial stream`, {
                            mic: microphoneDevice,
                            cam: cameraDevice,
                            stream: this.currentStream,
                            isAudioOnly: this.isAudioOnly
                        });

                        this.logger.debug(`${this.loggerPrefix} Subscribing to active video and microphone device changes`);
                        this.userMediaService.activeVideoDevice$.subscribe(videoDevice => {
                            this.onActiveCameraChanged(videoDevice);
                        });

                        this.userMediaService.activeMicrophoneDevice$.subscribe(activeMicrophoneDevice => {
                            this.onActiveMicrophoneChanged(activeMicrophoneDevice);
                        });

                        this.userMediaService.isAudioOnly$.subscribe(audioOnly => {
                            this.onIsAudioOnlyChanged(audioOnly);
                        });
                    });
            });
    }

    private onIsAudioOnlyChanged(audioOnly: boolean) {
        this.logger.debug(`${this.loggerPrefix} is audio only changed.`, {
            newAudioOnly: audioOnly,
            oldAudioOnly: this.isAudioOnly
        });

        this.isAudioOnly = audioOnly;
        if (this.isAudioOnly) {
            this.logger.debug(`${this.loggerPrefix} removing active camera tracks.`, {
                audioOnly: this.isAudioOnly,
                activeCamera: this.activeCameraStream,
                currentStream: this.currentStream
            });

            this.activeCameraStream?.getTracks().forEach(track => this.currentStream.removeTrack(track));
        } else {
            this.logger.debug(`${this.loggerPrefix} adding active camera tracks.`, {
                audioOnly: this.isAudioOnly,
                activeCamera: this.activeCameraStream,
                currentStream: this.currentStream
            });

            this.activeCameraStream?.getTracks().forEach(track => this.currentStream.addTrack(track));
        }

        this.streamModifiedSubject.next();

        this.logger.info(`${this.loggerPrefix} Audio only update complete.`, {
            audioOnly: this.isAudioOnly,
            activeCamera: this.activeCameraStream,
            currentStream: this.currentStream
        });
    }

    private onActiveCameraChanged(cameraDevice: UserMediaDevice) {
        this.logger.debug(`${this.loggerPrefix} active camera changed. Fetching stream for the new device.`, {
            newCam: cameraDevice,
            oldMicStream: this.activeCameraStream,
            isAudioOnly: this.isAudioOnly
        });

        this.mediaStreamService
            .getStreamForCam(cameraDevice)
            .pipe(take(1))
            .subscribe(cameraStream => {
                this.logger.debug(`${this.loggerPrefix} Got camera stream`, {
                    newCam: cameraDevice,
                    newCamStream: cameraStream,
                    oldCamStream: this.activeCameraStream,
                    isAudioOnly: this.isAudioOnly
                });

                if (!this.isAudioOnly) {
                    this.logger.debug(`${this.loggerPrefix} Not audio only. Updating current stream.`, {
                        isAudioOnly: this.isAudioOnly
                    });

                    this.activeCameraStream?.getTracks().forEach(track => {
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
                } else {
                    this.logger.debug(`${this.loggerPrefix} Audio only. NOT updating current stream.`, {
                        isAudioOnly: this.isAudioOnly
                    });
                }

                this.activeCameraStream = cameraStream;
                this.streamModifiedSubject.next();

                this.logger.info(`${this.loggerPrefix} Finished updating active camera stream`, {
                    activeCamStream: this.activeCameraStream,
                    currentStream: this.currentStream,
                    isAudioOnly: this.isAudioOnly
                });
            });
    }

    private onActiveMicrophoneChanged(microphoneDevice: UserMediaDevice) {
        this.logger.debug(`${this.loggerPrefix} active microphone changed. Fetching stream for the new device.`, {
            newMic: microphoneDevice,
            oldMicStream: this.activeMicrophoneStream,
            isAudioOnly: this.isAudioOnly
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
                    newMic: microphoneDevice,
                    newMicStream: microphoneStream,
                    oldMicStream: this.activeMicrophoneStream,
                    isAudioOnly: this.isAudioOnly
                });

                this.activeMicrophoneStream?.getTracks().forEach(track => {
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

                this.activeMicrophoneStream = microphoneStream;
                this.streamModifiedSubject.next();

                this.logger.info(`${this.loggerPrefix} Updated active microphone for current stream`, {
                    activeMicStream: this.activeMicrophoneStream,
                    currentStream: this.currentStream,
                    isAudioOnly: this.isAudioOnly
                });
            });
    }
}
