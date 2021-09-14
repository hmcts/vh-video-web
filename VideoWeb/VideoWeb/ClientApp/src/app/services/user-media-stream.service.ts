import { Injectable } from '@angular/core';
import 'webrtc-adapter';
import { UserMediaDevice } from '../shared/models/user-media-device';
import { Logger } from './logging/logger-base';
import { Observable, ReplaySubject, Subject, zip } from 'rxjs';
import { UserMediaService } from './user-media.service';
import { skip, take, takeUntil } from 'rxjs/operators';
import { MediaStreamService } from './media-stream.service';
import { mustProvideAMicrophoneDeviceError } from './errors/must-provide-a-microphone-device.error';

@Injectable({
    providedIn: 'root'
})
export class UserMediaStreamService {
    private readonly loggerPrefix = '[UserMediaStreamService] -';

    private currentStream: MediaStream;

    private isAudioOnly = false;

    private _activeCameraStream: MediaStream | null;
    private get activeCameraStream(): MediaStream | null {
        return this._activeCameraStream;
    }
    private set activeCameraStream(stream: MediaStream | null) {
        this._activeCameraStream = stream;
        this.activeCameraStreamSubject.next(stream);
    }
    private activeCameraStreamSubject = new ReplaySubject<MediaStream | null>(1);
    get activeCameraStream$(): Observable<MediaStream | null> {
        return this.activeCameraStreamSubject.asObservable();
    }

    private _activeMicrophoneStream: MediaStream | null;
    private get activeMicrophoneStream(): MediaStream | null {
        return this._activeMicrophoneStream;
    }
    private set activeMicrophoneStream(stream: MediaStream | null) {
        this._activeMicrophoneStream = stream;
        this.activeMicrophoneStreamSubject.next(stream);
    }
    private activeMicrophoneStreamSubject = new ReplaySubject<MediaStream | null>(1);
    get activeMicrophoneStream$(): Observable<MediaStream | null> {
        return this.activeMicrophoneStreamSubject.asObservable();
    }

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
            .pipe(takeUntil(this.userMediaService.activeVideoDevice$.pipe(skip(1))))
            .subscribe(cameraStream => {
                this.logger.debug(`${this.loggerPrefix} Got camera stream`, {
                    cam: cameraDevice,
                    stream: cameraStream,
                    isAudioOnly: this.isAudioOnly
                });

                this.currentStream = this.mediaStreamService.initialiseNewStream(cameraStream.getVideoTracks());
                this.activeCameraStream = cameraStream;

                if (!this.activeMicrophoneStream) {
                    this.mediaStreamService
                        .getStreamForMic(microphoneDevice)
                        .pipe(take(1))
                        .subscribe(microphoneStream => {
                            this.logger.debug(`${this.loggerPrefix} Got microphone stream`, {
                                mic: microphoneDevice,
                                stream: microphoneStream,
                                isAudioOnly: this.isAudioOnly
                            });

                            microphoneStream.getAudioTracks().forEach(track => {
                                this.currentStream.addTrack(track);
                            });

                            this.activeMicrophoneStream = microphoneStream;

                            this.logger.info(`${this.loggerPrefix} Built initial stream`, {
                                mic: microphoneDevice,
                                cam: cameraDevice,
                                stream: this.currentStream,
                                tracks: this.currentStream.getTracks(),
                                isAudioOnly: this.isAudioOnly
                            });

                            this.currentStreamSubject.next(this.currentStream);

                            this.logger.debug(`${this.loggerPrefix} Subscribing to active video and microphone device changes`);
                            this.userMediaService.activeVideoDevice$.pipe(skip(1)).subscribe(videoDevice => {
                                this.onActiveCameraChanged(videoDevice);
                            });

                            this.userMediaService.activeMicrophoneDevice$.pipe(skip(1)).subscribe(activeMicrophoneDevice => {
                                this.onActiveMicrophoneChanged(activeMicrophoneDevice);
                            });

                            this.userMediaService.isAudioOnly$.subscribe(audioOnly => {
                                this.onIsAudioOnlyChanged(audioOnly);
                            });
                        });
                }
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

            this.activeCameraStream?.getVideoTracks().forEach(track => this.currentStream.removeTrack(track));
            this.activeCameraStreamSubject.next(null);
        } else {
            this.logger.debug(`${this.loggerPrefix} adding active camera tracks.`, {
                audioOnly: this.isAudioOnly,
                activeCamera: this.activeCameraStream,
                currentStream: this.currentStream
            });

            this.activeCameraStream?.getVideoTracks().forEach(track => this.currentStream.addTrack(track));
            this.activeCameraStreamSubject.next(this.activeCameraStream);
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
            oldCamStream: this.activeCameraStream,
            oldCamTracks: this.activeCameraStream?.getVideoTracks(),
            currentStreamTracks: this.currentStream.getTracks(),
            isAudioOnly: this.isAudioOnly
        });

        this.activeCameraStream?.getVideoTracks().forEach(track => {
            this.currentStream.removeTrack(track);
            track.stop();

            this.logger.debug(`${this.loggerPrefix} cam changed. Removed and stopped track`, {
                track: track
            });
        });

        this.mediaStreamService
            .getStreamForCam(cameraDevice)
            .pipe(takeUntil(this.userMediaService.activeVideoDevice$.pipe(skip(1))))
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

                    cameraStream?.getVideoTracks().forEach(track => {
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

        this.activeMicrophoneStream?.getAudioTracks().forEach(track => {
            this.currentStream.removeTrack(track);
            track.stop();

            this.logger.debug(`${this.loggerPrefix} mic changed. Removed and stopped track`, {
                track: track
            });
        });

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

                microphoneStream.getAudioTracks().forEach(track => {
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
