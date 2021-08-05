import { Injectable } from '@angular/core';

import { Results, SelfieSegmentation } from '@mediapipe/selfie_segmentation';
import { Camera } from '@mediapipe/camera_utils';
import { BackgroundEffect } from './models/background-effect';
import { UserMediaStreamService } from './user-media-stream.service';
import { Logger } from './logging/logger-base';
import { UserMediaService } from './user-media.service';
import { Observable, Subject } from 'rxjs';
import { VideoCallService } from '../waiting-space/services/video-call.service';

@Injectable({
    providedIn: 'root'
})
export class VirtualBackgroundService {
    private readonly loggerPrefix = '[VirtualBackgroundService] -';

    private _onFilterChanged = new Subject<BackgroundEffect | null>();
    get onFilterChanged(): Observable<BackgroundEffect | null> {
        return this._onFilterChanged.asObservable();
    }

    videoElement: HTMLVideoElement;
    canvasElement: HTMLCanvasElement;

    canvasCtx: CanvasRenderingContext2D;

    filterOn: boolean;
    selfieSegmentation: SelfieSegmentation;
    activeEffect: BackgroundEffect;
    imgs: Map<BackgroundEffect, HTMLImageElement> = new Map();

    currentStream: MediaStream;

    originalAudioSource: MediaStream;
    originalVideoSource: MediaStream;
    originalOutgoingStream: MediaStream | URL;

    /**
     *
     */
    constructor(
        private userMediaStreamService: UserMediaStreamService,
        private userMediaService: UserMediaService,
        private videoCallService: VideoCallService,
        private logger: Logger
    ) {
        this.filterOn = false;
        this.activeEffect = BackgroundEffect.architecture;
        this.initElementsAndCtx();
    }

    initElementsAndCtx() {
        this.videoElement = document.createElement('video');
        this.canvasElement = document.createElement('canvas');

        this.canvasCtx = this.canvasElement.getContext('2d');

        this.selfieSegmentation = new SelfieSegmentation({
            locateFile: file => {
                return `https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation@0.1.1622680987/${file}`;
            }
        });
        this.selfieSegmentation.setOptions({
            modelSelection: 1,
            selfieMode: false
        });
    }

    updateFilter(filter: BackgroundEffect | null) {
        if (filter) {
            this.activeEffect = filter;
            this.filterOn = true;
        } else {
            this.activeEffect = null;
            this.filterOn = false;
        }

        this._onFilterChanged.next(this.activeEffect);
    }

    async applyFilter(): Promise<MediaStream | URL> {
        const filteredStream = await this.getFilteredStream();
        this.videoCallService.pexipAPI.video_source = null;
        this.videoCallService.pexipAPI.audio_source = null;
        this.videoCallService.pexipAPI.user_media_stream = filteredStream;
        return filteredStream;
    }

    private async getCameraStream(): Promise<MediaStream> {
        const preferredCamera = await this.userMediaService.getPreferredCamera();
        this.logger.debug(`${this.loggerPrefix} using preferred camera ${preferredCamera?.label}`);
        const camStream = await this.userMediaStreamService.getStreamForCam(preferredCamera);
        return camStream;
    }

    async getFilteredStream(): Promise<MediaStream> {
        this.logger.debug(`${this.loggerPrefix} starting image segmentation`);
        if (!this.videoElement || !this.canvasElement || !this.canvasCtx) {
            throw new Error(`Background Service context not initialised`);
        }
        if (!this.currentStream) {
            this.currentStream = await this.getCameraStream();
        }

        this.selfieSegmentation.onResults(results => this.onSelfieSegmentationResults(results));

        const camera = new Camera(this.videoElement, {
            onFrame: async () => {
                await this.selfieSegmentation.send({ image: this.videoElement });
            }
        });

        camera.start();
        const stream = this.canvasElement.captureStream();
        this.currentStream.getAudioTracks().forEach(track => {
            stream.addTrack(track);
        });
        return stream;
    }

    onSelfieSegmentationResults(results: Results): void {
        // Draw the overlays.
        this.canvasCtx.save();
        this.canvasCtx.clearRect(0, 0, this.canvasElement.width, this.canvasElement.height);

        this.canvasCtx.drawImage(results.segmentationMask, 0, 0, this.canvasElement.width, this.canvasElement.height);

        // Only overwrite existing pixels.
        this.canvasCtx.globalCompositeOperation = 'source-in';

        this.canvasCtx.drawImage(results.image, 0, 0, this.canvasElement.width, this.canvasElement.height);

        // Only overwrite missing pixels.
        this.canvasCtx.globalCompositeOperation = 'destination-atop';
        this.applyEffect(results);
        this.canvasCtx.restore();
    }

    applyEffect(results: Results) {
        switch (this.activeEffect) {
            case BackgroundEffect.architecture:
            case BackgroundEffect.pyramid:
                this.applyVirtualBackgroundEffect();
                break;
            default:
                this.applyBlurEffect(results);
                break;
        }
    }

    applyBlurEffect(results: Results) {
        this.canvasCtx.filter = 'blur(10px)';
        this.canvasCtx.drawImage(results.image, 0, 0, this.canvasElement.width, this.canvasElement.height);
    }

    applyVirtualBackgroundEffect() {
        const imageObject = this.getImageForBackground();
        this.canvasCtx.imageSmoothingEnabled = true;
        this.canvasCtx.drawImage(imageObject, 0, 0, this.canvasElement.width, this.canvasElement.height);
    }

    private getImageForBackground(): HTMLImageElement {
        if (this.imgs.has(this.activeEffect)) {
            return this.imgs.get(this.activeEffect);
        }

        const imageName = this.activeEffect.toString().toLowerCase();
        const imagePath = `/assets/images/${imageName}.jpg`;
        // With Background image
        const imageObject = new Image();
        imageObject.src = imagePath;
        this.imgs.set(this.activeEffect, imageObject);
        return imageObject;
    }
}
