import { Injectable } from '@angular/core';
import 'webrtc-adapter';
import { UserMediaDevice } from '../shared/models/user-media-device';
import { Logger } from './logging/logger-base';
import { Observable, ReplaySubject, Subject, zip } from 'rxjs';
import { UserMediaService } from './user-media.service';
import { skip, take, takeUntil } from 'rxjs/operators';
import { MediaStreamService } from './media-stream.service';
import { mustProvideAMicrophoneDeviceError } from './errors/must-provide-a-microphone-device.error';
import { AudioOnlyImageService } from './audio-only-image.service';

@Injectable({
    providedIn: 'root'
})
export class UserMediaStreamService {
    private readonly loggerPrefix = '[UserMediaStreamService] -';
    private currentStream: MediaStream;
    private audioOnlyImageStream: MediaStream;
    private _activeCameraStream: MediaStream | null;
    private _activeMicrophoneStream: MediaStream | null;
    private isAudioOnly = false;
    private activeCameraStreamSubject = new ReplaySubject<MediaStream | null>(1);
    private activeMicrophoneStreamSubject = new ReplaySubject<MediaStream | null>(1);
    private currentStreamSubject = new ReplaySubject<MediaStream>(1);
    private streamModifiedSubject = new Subject<void>();

    constructor(
        private logger: Logger,
        private userMediaService: UserMediaService,
        private mediaStreamService: MediaStreamService,
        private audioOnlyImageService: AudioOnlyImageService
    ) {
        this.logger.debug(
            `${this.loggerPrefix} Constructor called. Attempting to get active devices from userMediaService to initialise the stream.`
        );

        this.logger.debug(`${this.loggerPrefix} Subscribing to active video and microphone device changes`);

        this.initialiseCurrentStream();

        this.userMediaService.activeVideoDevice$.subscribe(videoDevice => {
            this.onActiveCameraChanged(videoDevice);
        });

        this.userMediaService.activeMicrophoneDevice$.subscribe(activeMicrophoneDevice => {
            this.onActiveMicrophoneChanged(activeMicrophoneDevice);
        });

        this.userMediaService.isAudioOnly$.subscribe(audioOnly => {
            this.onIsAudioOnlyChanged(audioOnly);
        });
    }

    get activeCameraStream$(): Observable<MediaStream | null> {
        return this.activeCameraStreamSubject.asObservable();
    }

    get activeMicrophoneStream$(): Observable<MediaStream | null> {
        return this.activeMicrophoneStreamSubject.asObservable();
    }

    get currentStream$() {
        return this.currentStreamSubject.asObservable();
    }

    get streamModified$() {
        return this.streamModifiedSubject.asObservable();
    }

    private get activeCameraStream(): MediaStream | null {
        return this._activeCameraStream;
    }

    private get activeMicrophoneStream(): MediaStream | null {
        return this._activeMicrophoneStream;
    }

    private set activeCameraStream(stream: MediaStream | null) {
        this._activeCameraStream = stream;
        this.activeCameraStreamSubject.next(stream);
    }

    private set activeMicrophoneStream(stream: MediaStream | null) {
        this._activeMicrophoneStream = stream;
        this.activeMicrophoneStreamSubject.next(stream);
    }

    private initialiseCurrentStream() {
        zip(this.activeCameraStream$, this.activeMicrophoneStream$)
            .pipe(take(1))
            .subscribe(streams => {
                const cameraStream = streams[0];
                const microphoneStream = streams[1];

                this.logger.debug(`${this.loggerPrefix} activeCameraStream and activeMicrophoneStream created. Building current stream.`, {
                    activeCameraStream: cameraStream ?? null,
                    activeCameraStreamTrackLabel: cameraStream?.getVideoTracks()[0]?.label ?? null,
                    activeMicrophoneStream: microphoneStream?.getAudioTracks()[0]?.label ?? null
                });

                this.currentStream = this.mediaStreamService.initialiseNewStream([
                    ...cameraStream.getVideoTracks(),
                    ...microphoneStream.getAudioTracks()
                ]);
                this.currentStreamSubject.next(this.currentStream);

                this.logger.debug(`${this.loggerPrefix} current stream built.`);
            });
    }

    private onIsAudioOnlyChanged(audioOnly: boolean) {
        if (audioOnly === this.isAudioOnly) {
            return;
        }

        this.logger.debug(`${this.loggerPrefix} is audio only changed.`, {
            newAudioOnly: audioOnly,
            oldAudioOnly: this.isAudioOnly
        });

        this.isAudioOnly = audioOnly;
        if (this.isAudioOnly) {
            this.logger.debug(`${this.loggerPrefix} audio only is true.`);
            this.logger.debug(`${this.loggerPrefix} removing active camera tracks.`, {
                audioOnly: this.isAudioOnly,
                activeCamera: this.activeCameraStream,
                currentStream: this.currentStream
            });

            this.activeCameraStream?.getVideoTracks().forEach(track => {
                this.currentStream.removeTrack(track);
                this.logger.debug(`${this.loggerPrefix} video track removed from current stream. Track not stopped`, {
                    track: track
                });
            });

            this.logger.debug(`${this.loggerPrefix} audio only image service called.`);
            this.audioOnlyImageService
                .getAudioOnlyImageStream()
                .pipe(take(1))
                .subscribe(stream => {
                    this.audioOnlyImageStream = stream;

                    this.logger.debug(`${this.loggerPrefix} adding audio only image tracks.`, {
                        audioOnly: this.isAudioOnly,
                        activeCamera: this.activeCameraStream,
                        audioOnlyImage: this.audioOnlyImageStream,
                        currentStream: this.currentStream
                    });

                    this.audioOnlyImageStream.getTracks().forEach(track => this.currentStream.addTrack(track));

                    this.activeCameraStreamSubject.next(this.audioOnlyImageStream);
                    this.streamModifiedSubject.next();
                });
        } else {
            this.logger.debug(`${this.loggerPrefix} audio only is false.`);
            this.logger.debug(`${this.loggerPrefix} removing audio only image tracks.`, {
                audioOnly: this.isAudioOnly,
                activeCamera: this.activeCameraStream,
                audioOnlyImage: this.audioOnlyImageStream,
                currentStream: this.currentStream
            });
            this.audioOnlyImageStream.getTracks().forEach(track => {
                this.currentStream.removeTrack(track);
                track.stop();
                this.logger.debug(`${this.loggerPrefix} audio only image track removed from current stream and then stopped.`, {
                    track: track
                });
            });
            this.audioOnlyImageStream = null;

            this.logger.debug(`${this.loggerPrefix} adding active camera tracks.`, {
                audioOnly: this.isAudioOnly,
                activeCamera: this.activeCameraStream,
                currentStream: this.currentStream
            });

            this.activeCameraStream?.getVideoTracks().forEach(track => this.currentStream.addTrack(track));
            this.activeCameraStreamSubject.next(this.activeCameraStream);
            this.streamModifiedSubject.next();
        }

        this.logger.debug(`${this.loggerPrefix} Audio only update complete.`, {
            audioOnly: this.isAudioOnly,
            activeCamera: this.activeCameraStream,
            currentStream: this.currentStream,
            currentStreamTracks: this.currentStream.getTracks().map(x => x.label)
        });
    }

    private onActiveCameraChanged(cameraDevice: UserMediaDevice) {
        this.logger.debug(`${this.loggerPrefix} active camera changed. Fetching stream for the new device.`, {
            newCam: cameraDevice,
            oldCamStream: this.activeCameraStream ?? null,
            oldCamTracks: this.activeCameraStream?.getVideoTracks() ?? null,
            currentStreamTracks: this.currentStream?.getTracks() ?? null,
            isAudioOnly: this.isAudioOnly
        });

        this.activeCameraStream?.getVideoTracks().forEach(track => {
            this.currentStream?.removeTrack(track);
            track.stop();

            this.logger.debug(`${this.loggerPrefix} cam changed. Removed and stopped track`, {
                track: track
            });
        });

        this._activeCameraStream = null;

        this.mediaStreamService
            .getStreamForCam(cameraDevice)
            .pipe(takeUntil(this.userMediaService.activeVideoDevice$.pipe(skip(1))))
            .subscribe(cameraStream => {
                this.logger.debug(`${this.loggerPrefix} Got camera stream`, {
                    newCam: cameraDevice,
                    newCamStream: cameraStream ?? null,
                    oldCamStream: this.activeCameraStream ?? null,
                    isAudioOnly: this.isAudioOnly
                });

                this.activeCameraStream?.getVideoTracks().forEach(track => {
                    this.currentStream?.removeTrack(track);

                    this.logger.debug(`${this.loggerPrefix} cam changed. Removed track. Track not stopped`, {
                        track: track
                    });
                });

                if (!this.isAudioOnly) {
                    this.logger.debug(`${this.loggerPrefix} Not audio only. Updating current stream.`, {
                        isAudioOnly: this.isAudioOnly
                    });

                    if (this.currentStream) {
                        cameraStream?.getVideoTracks().forEach(track => {
                            this.currentStream.addTrack(track);

                            this.logger.debug(`${this.loggerPrefix} cam changed. Added track`, {
                                track: track
                            });
                        });

                        this.logger.debug(`${this.loggerPrefix} Updated active camera for current stream`, {
                            activeCamStream: this.activeCameraStream,
                            currentStream: this.currentStream,
                            isAudioOnly: this.isAudioOnly
                        });
                    }
                } else {
                    this.logger.debug(`${this.loggerPrefix} Audio only. NOT updating current stream.`, {
                        isAudioOnly: this.isAudioOnly
                    });
                }

                this.activeCameraStream = cameraStream;

                if (!!this.currentStream) {
                    this.streamModifiedSubject.next();
                }

                this.logger.debug(`${this.loggerPrefix} updated active camera stream.`);
            });
    }

    private onActiveMicrophoneChanged(microphoneDevice: UserMediaDevice) {
        this.logger.debug(`${this.loggerPrefix} active microphone changed. Fetching stream for the new device.`, {
            newMic: microphoneDevice,
            oldMicStream: this.activeMicrophoneStream ?? null,
            isAudioOnly: this.isAudioOnly
        });

        if (!microphoneDevice) {
            this.logger.warn(`${this.loggerPrefix} must provide a microphone device`);
            throw mustProvideAMicrophoneDeviceError();
        }

        this.activeMicrophoneStream?.getAudioTracks().forEach(track => {
            this.currentStream?.removeTrack(track);
            track.stop();

            this.logger.debug(`${this.loggerPrefix} mic changed. Removed and stopped track`, {
                track: track
            });
        });

        this._activeMicrophoneStream = null;

        this.mediaStreamService
            .getStreamForMic(microphoneDevice)
            .pipe(take(1))
            .subscribe(microphoneStream => {
                this.logger.debug(`${this.loggerPrefix} Got microphone stream`, {
                    newMic: microphoneDevice,
                    newMicStream: microphoneStream ?? null,
                    oldMicStream: this.activeMicrophoneStream ?? null,
                    isAudioOnly: this.isAudioOnly
                });

                if (this.currentStream) {
                    microphoneStream.getAudioTracks().forEach(track => {
                        // track.contentHint = 'interpreter';
                        this.currentStream.addTrack(track);

                        this.logger.debug(`${this.loggerPrefix} mic changed. Added track`, {
                            track: track
                        });
                    });

                    this.logger.debug(`${this.loggerPrefix} Updated active microphone for current stream`, {
                        activeMicStream: this.activeMicrophoneStream,
                        currentStream: this.currentStream,
                        isAudioOnly: this.isAudioOnly
                    });
                }

                this.activeMicrophoneStream = microphoneStream;

                if (!!this.currentStream) {
                    this.streamModifiedSubject.next();
                }

                this.logger.debug(`${this.loggerPrefix} updated active microphone stream.`);
            });
    }
}
