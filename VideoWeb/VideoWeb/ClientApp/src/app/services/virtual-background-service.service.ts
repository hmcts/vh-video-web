import { Injectable } from '@angular/core';

import { Results, SelfieSegmentation } from '@mediapipe/selfie_segmentation';
import { Camera } from '@mediapipe/camera_utils';
import { BackgroundFilter } from './models/background-filter';
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

    // private _onFilterChanged = new Subject<BackgroundFilter | null>();
    // get onFilterChanged(): Observable<BackgroundFilter | null> {
    //     return this._onFilterChanged.asObservable();
    // }

    private _onStreamFiltered = new Subject<MediaStream | URL>();
    get onStreamFiltered(): Observable<MediaStream | URL> {
        return this._onStreamFiltered.asObservable();
    }

    videoElement: HTMLVideoElement;
    canvasElement: HTMLCanvasElement;

    canvasCtx: CanvasRenderingContext2D;
    canvasWebGlCtx: WebGL2RenderingContext;

    filterOn: boolean;
    selfieSegmentation: SelfieSegmentation;
    activeFilter: BackgroundFilter;
    imgs: Map<BackgroundFilter, HTMLImageElement> = new Map();

    currentUnfilteredCameraStream: MediaStream;
    private currentFilteredCameraStream: MediaStream;
    private originalAudioSource: MediaStream;
    private originalVideoSource: MediaStream;
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
        this.activeFilter = BackgroundFilter.blur;
        this.initElementsAndCtx();
    }

    private initElementsAndCtx() {
        this.videoElement = document.createElement('video');
        this.canvasElement = document.createElement('canvas');

        this.canvasCtx = this.canvasElement.getContext('2d');
        this.canvasWebGlCtx = this.canvasElement.getContext('webgl2');

        this.selfieSegmentation = new SelfieSegmentation({
            locateFile: file => {
                return `https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation@0.1.1622680987/${file}`;
            }
        });
        this.selfieSegmentation.setOptions({
            modelSelection: 1,
            selfieMode: false
        });

        this.userMediaService.onPreferredCameraChanged$.subscribe(async () => {
            this.logger.debug(`${this.loggerPrefix} preferred camera changed, updating stream`);
            this.currentUnfilteredCameraStream = await this.getStreamForPreferredCamera();
            this._onStreamFiltered.next(this.currentUnfilteredCameraStream);
        });
    }

    // async startFilteredStream(): Promise<MediaStream> {
    async startFilteredStream() {
        this.logger.debug(`${this.loggerPrefix} starting image segmentation`);
        if (!this.currentUnfilteredCameraStream) {
            this.logger.debug(`${this.loggerPrefix} no camera stream found, retrieving stream for preferred camera`);
            this.currentUnfilteredCameraStream = await this.getStreamForPreferredCamera();
        }
        if (this.currentFilteredCameraStream) {
            this.logger.debug(`${this.loggerPrefix} filtered stream alreadt started`);
            return;
        }

        this.selfieSegmentation.onResults(results => this.onSelfieSegmentationResults(results));

        const camera = new Camera(this.videoElement, {
            onFrame: async () => {
                await this.selfieSegmentation.send({ image: this.videoElement });
            }
        });

        camera.start();
        const stream = this.canvasElement.captureStream();
        this.currentUnfilteredCameraStream.getAudioTracks().forEach(track => {
            stream.addTrack(track);
        });
        this.currentFilteredCameraStream = stream;
    }

    updateFilter(filter: BackgroundFilter | null) {
        this.logger.debug(`${this.loggerPrefix} Updating filter to ${filter}`);
        if (filter) {
            this.activeFilter = filter;
            this.filterOn = true;
            this.logger.debug(`${this.loggerPrefix} Filter on`);
            this.replacePexipWithFilteredStream();
            this._onStreamFiltered.next(this.currentFilteredCameraStream);
        } else {
            this.activeFilter = null;
            this.filterOn = false;
            this.logger.debug(`${this.loggerPrefix} Filter off`);
            this.replacePexipWithOriginalStream();
            this.logger.debug(`${this.loggerPrefix} publishing original stream`);
            this._onStreamFiltered.next(this.originalOutgoingStream);
        }

        // this._onFilterChanged.next(this.activeFilter);
    }

    // async applyFilterToPreferredCamera(): Promise<MediaStream | URL> {
    private async replacePexipWithFilteredStream() {
        await this.startFilteredStream();

        this.videoCallService.pexipAPI.video_source = null;
        this.videoCallService.pexipAPI.audio_source = null;
        this.videoCallService.pexipAPI.user_media_stream = this.currentFilteredCameraStream;
        this.logger.info(`${this.loggerPrefix} pexip client updated to use custom media stream`);
        // return filteredStream;
    }

    // removeFilter(): MediaStream | URL {
    private replacePexipWithOriginalStream() {
        this.videoCallService.pexipAPI.user_media_stream = null;
        this.videoCallService.pexipAPI.video_source = this.originalVideoSource;
        this.videoCallService.pexipAPI.audio_source = this.originalAudioSource;
        this.logger.info(`${this.loggerPrefix} pexip client updated to use original sources`);
        // return this.originalOutgoingStream;
    }

    private async getStreamForPreferredCamera(): Promise<MediaStream> {
        const preferredCamera = await this.userMediaService.getPreferredCamera();
        this.logger.debug(`${this.loggerPrefix} using preferred camera ${preferredCamera?.label}`);
        const camStream = await this.userMediaStreamService.getStreamForCam(preferredCamera);
        return camStream;
    }

    // private onWebGlSelfieSegmentationResults(results: Results): void {
    //     // this.canvasWebGlCtx.
    // }

    private onSelfieSegmentationResults(results: Results): void {
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

    private applyEffect(results: Results) {
        switch (this.activeFilter) {
            case BackgroundFilter.HMCTS:
            case BackgroundFilter.SCTS:
                this.applyVirtualBackgroundEffect();
                break;
            default:
                this.applyBlurEffect(results);
                break;
        }
    }

    private applyBlurEffect(results: Results) {
        this.canvasCtx.filter = 'blur(10px)';
        this.canvasCtx.drawImage(results.image, 0, 0, this.canvasElement.width, this.canvasElement.height);
    }

    private applyVirtualBackgroundEffect() {
        const imageObject = this.getImageForBackground();
        this.canvasCtx.imageSmoothingEnabled = true;
        this.canvasCtx.drawImage(imageObject, 0, 0, this.canvasElement.width, this.canvasElement.height);
    }

    private getImageForBackground(): HTMLImageElement {
        if (this.imgs.has(this.activeFilter)) {
            return this.imgs.get(this.activeFilter);
        }

        let imageName = '';
        if (this.activeFilter === BackgroundFilter.HMCTS) {
            imageName = 'VhBgFilterHMCTS';
        } else if (this.activeFilter === BackgroundFilter.SCTS) {
            imageName = 'VhBgFilterSCTS';
        }
        const imagePath = `/assets/images/${imageName}.jpg`;

        this.logger.debug(`${this.loggerPrefix} retrieving image for filter ${this.activeFilter} from ${imagePath}`);

        // With Background image
        const imageObject = new Image();
        imageObject.src = imagePath;
        this.imgs.set(this.activeFilter, imageObject);
        return imageObject;
    }
}
