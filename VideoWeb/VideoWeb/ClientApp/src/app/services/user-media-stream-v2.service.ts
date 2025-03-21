import { combineLatest, Observable, of, ReplaySubject, Subject, zip } from 'rxjs';
import { UserMediaDevice } from '../shared/models/user-media-device';
import { AudioOnlyImageService } from './audio-only-image.service';
import { MediaStreamService } from './media-stream.service';
import { UserMediaService } from './user-media.service';
import { distinctUntilChanged, map, tap } from 'rxjs/operators';
import { Injectable } from '@angular/core';
import { Logger } from './logging/logger-base';

@Injectable({
    providedIn: 'root'
})
export class UserMediaStreamServiceV2 {
    currentStream: MediaStream | null = null;

    private readonly loggerPrefix = '[UserMediaStreamServiceV2] -';

    private currentMicDevice: UserMediaDevice | null = null;
    private currentCamDevice: UserMediaDevice | null = null;
    private audioOnly = false;

    private _currentStream$: Subject<MediaStream> = new ReplaySubject<MediaStream>(1);

    constructor(
        private logger: Logger,
        private userMediaService: UserMediaService,
        private mediaStreamService: MediaStreamService,
        private audioOnlyImageService: AudioOnlyImageService
    ) {
        const activeVideoDevice$ = this.userMediaService.activeVideoDevice$;
        const activeMicrophoneDevice$ = this.userMediaService.activeMicrophoneDevice$;
        const isAudioOnly$ = this.userMediaService.isAudioOnly$;

        combineLatest([activeVideoDevice$, activeMicrophoneDevice$, isAudioOnly$])
            .pipe(distinctUntilChanged((prev, curr) => JSON.stringify(prev) === JSON.stringify(curr)))
            .subscribe(([videoDevice, microphoneDevice, audioOnly]) => {
                this.logger.debug(`${this.loggerPrefix} Active devices changed.`, {
                    videoDevice: videoDevice?.label ?? 'No Camera Device',
                    microphoneDevice: microphoneDevice?.label ?? 'No Microphone Device',
                    audioOnly
                });
                this.currentCamDevice = videoDevice;
                this.currentMicDevice = microphoneDevice;
                this.audioOnly = audioOnly;

                this.createAndPublishStream();
            });
    }

    get currentStream$() {
        return this._currentStream$.asObservable();
    }

    /**
     * Create a new media stream with the current camera and microphone devices.
     * If the user has selected audio only, the video stream will be replaced with an image only stream.
     * @returns
     */
    createAndPublishStream() {
        this.userMediaService.initialise();
        if (this.currentStream) {
            this.currentStream.getTracks().forEach(track => track.stop());
        }

        let audioStream$: Observable<MediaStream>;
        let videoStream$: Observable<MediaStream>;

        if (this.audioOnly) {
            videoStream$ = this.audioOnlyImageService.getAudioOnlyImageStream();
            if (this.currentMicDevice) {
                this.logger.debug(`${this.loggerPrefix} Creating audio only stream with microphone device.`);
                audioStream$ = this.mediaStreamService.getStreamForMic(this.currentMicDevice);
            } else {
                this.logger.debug(`${this.loggerPrefix} Creating audio only stream without microphone device.`);
                audioStream$ = of(this.mediaStreamService.initialiseNewStream([]));
            }
        } else {
            if (this.currentMicDevice) {
                this.logger.debug(`${this.loggerPrefix} Creating mic stream with mic device ${this.currentMicDevice.label}.`);
                audioStream$ = this.mediaStreamService.getStreamForMic(this.currentMicDevice);
            } else {
                this.logger.debug(`${this.loggerPrefix} Creating mic stream without mic device.`);
                audioStream$ = of(this.mediaStreamService.initialiseNewStream([]));
            }

            if (this.currentCamDevice) {
                this.logger.debug(`${this.loggerPrefix} Creating video stream with cam device ${this.currentCamDevice.label}.`);
                videoStream$ = this.mediaStreamService.getStreamForCam(this.currentCamDevice);
            } else {
                this.logger.debug(`${this.loggerPrefix} Creating video stream without cam device.`);
                videoStream$ = of(this.mediaStreamService.initialiseNewStream([]));
            }
        }

        this.logger.debug(`${this.loggerPrefix} Creating and publishing new stream.`, {
            audioOnly: this.audioOnly,
            currentMicDevice: this.currentMicDevice?.label ?? 'No Microphone Device',
            currentCamDevice: this.currentCamDevice?.label ?? 'No Camera Device'
        });

        zip(audioStream$, videoStream$)
            .pipe(
                map(([audioStream, videoStream]) => this.combineAudioAndVideoStreams(audioStream, videoStream)),
                tap(combinedStream => {
                    this.currentStream = combinedStream;
                    this._currentStream$.next(combinedStream);
                    this.logger.debug(`${this.loggerPrefix} New stream created and published.`, {
                        videoDevice: this.currentCamDevice?.label ?? 'No Camera Device',
                        microphoneDevice: this.currentMicDevice?.label ?? 'No Microphone Device',
                        audioOnly: this.audioOnly
                    });
                })
            )
            .subscribe();
    }

    closeCurrentStream() {
        if (this.currentStream) {
            this.currentStream.getTracks().forEach(track => track.stop());
            this.currentStream = null;
            this._currentStream$.next(new MediaStream([]));
            this.logger.debug(`${this.loggerPrefix} current stream set to closed and set to null.`);
        }
    }

    private combineAudioAndVideoStreams(audioStream: MediaStream, videoStream: MediaStream): MediaStream {
        return this.mediaStreamService.initialiseNewStream([
            ...(audioStream ? audioStream.getAudioTracks() : []),
            ...(videoStream ? videoStream.getVideoTracks() : [])
        ]);
    }
}
