import { Injectable } from '@angular/core';
import { Camera } from '@mediapipe/camera_utils';
import { Results, SelfieSegmentation } from '@mediapipe/selfie_segmentation';
import { Observable, Subject } from 'rxjs';
import { Logger } from './logging/logger-base';
import { BackgroundFilter, IVideoFilterer } from './models/background-filter';

@Injectable({
    providedIn: 'root'
})
export class VideoFilterService {
    private readonly loggerPrefix = '[VideoFilterService] -';

    private _onFilterChanged = new Subject<BackgroundFilter | null>();
    get onFilterChanged(): Observable<BackgroundFilter | null> {
        return this._onFilterChanged.asObservable();
    }

    videoElement: HTMLVideoElement;
    canvasElement: HTMLCanvasElement;

    canvasCtx: CanvasRenderingContext2D;

    filterOn: boolean;
    selfieSegmentation: SelfieSegmentation;
    activeFilter: BackgroundFilter;
    imgs: Map<BackgroundFilter, HTMLImageElement> = new Map();

    constructor(private logger: Logger) {
        this.filterOn = false;
        this.activeFilter = null;
    }

    async initFilterStream(page: IVideoFilterer) {
        if (this.videoElement && this.videoElement.id === page?.retrieveVideoElement()?.id) {
            return;
        }
        this.logger.debug(`${this.loggerPrefix} initialising stream for filter`);
        this.videoElement = page.retrieveVideoElement();
        this.canvasElement = page.retrieveCanvasElement();
        this.canvasCtx = this.canvasElement.getContext('2d');

        this.selfieSegmentation = new SelfieSegmentation({
            locateFile: file => {
                return `https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation@0.1.1628007100/${file}`;
            }
        });
        this.selfieSegmentation.setOptions({
            modelSelection: 1,
            selfieMode: true
        });

        this.logger.debug(`${this.loggerPrefix} starting filtered stream`);
        this.selfieSegmentation.onResults(results => this.onSelfieSegmentationResults(results));

        const camera = new Camera(this.videoElement, {
            onFrame: async () => {
                await this.selfieSegmentation.send({ image: this.videoElement });
            }
        });
        camera.start();
    }

    startFilteredStream(skipAudio?: boolean) {
        const canvasStream = this.canvasElement.captureStream();
        if (!skipAudio) {
            (this.videoElement.srcObject as MediaStream).getAudioTracks().forEach(track => {
                canvasStream.addTrack(track);
            });
        }
        return canvasStream;
    }

    stopStream() {
        this.canvasCtx.save();
        this.canvasCtx.clearRect(0, 0, this.canvasElement.width, this.canvasElement.height);
    }

    updateFilter(filter: BackgroundFilter | null) {
        this.logger.debug(`${this.loggerPrefix} Updating filter to ${filter}`);
        if (filter) {
            this.activeFilter = filter;
            this.filterOn = true;
            this.logger.debug(`${this.loggerPrefix} Filter on`);
            this._onFilterChanged.next(filter);
        } else {
            this.activeFilter = null;
            this.filterOn = false;
            this.logger.debug(`${this.loggerPrefix} Filter off`);
            this._onFilterChanged.next(null);
        }
    }

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
            case BackgroundFilter.blur:
                this.applyBlurEffect(results, true);
                break;
            default:
                this.applyBlurEffect(results, false);
                break;
        }
    }

    private applyBlurEffect(results: Results, withBlur: boolean) {
        if (withBlur) {
            this.canvasCtx.filter = 'blur(10px)';
        }
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
