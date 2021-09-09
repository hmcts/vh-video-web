import { Injectable } from '@angular/core';
import { Camera } from '@mediapipe/camera_utils';
import { Results, SelfieSegmentation } from '@mediapipe/selfie_segmentation';
import { Observable, Subject } from 'rxjs';
import { browsers } from '../shared/browser.constants';
import { DeviceTypeService } from './device-type.service';
import { Logger } from './logging/logger-base';
import { BackgroundFilter } from './models/background-filter';
import { SessionStorage } from './session-storage';

@Injectable({
    providedIn: 'root'
})
export class VideoFilterService {
    private readonly loggerPrefix = '[VideoFilterService] -';

    private _canvasWidth = 1280;
    private _canvasHeight = 720;

    private readonly preferredFilterCache: SessionStorage<BackgroundFilter>;
    readonly PREFERRED_FILTER_KEY = 'vh.preferred.filter';

    private _onFilterChanged = new Subject<BackgroundFilter | null>();
    get onFilterChanged$(): Observable<BackgroundFilter | null> {
        return this._onFilterChanged.asObservable();
    }

    videoElement: HTMLVideoElement;
    canvasElement: HTMLCanvasElement;
    canvasStream: MediaStream;

    canvasCtx: CanvasRenderingContext2D;

    filterOn: boolean;
    selfieSegmentation: SelfieSegmentation;
    activeFilter: BackgroundFilter;
    imgs: Map<BackgroundFilter, HTMLImageElement> = new Map();

    constructor(private deviceTypeService: DeviceTypeService, private logger: Logger) {
        this.preferredFilterCache = new SessionStorage(this.PREFERRED_FILTER_KEY);

        if (!this.preferredFilterCache.get()) {
            this.filterOn = false;
            this.activeFilter = null;
        } else {
            this.activeFilter = this.preferredFilterCache.get();
            this.filterOn = true;
        }

        this.selfieSegmentation = new SelfieSegmentation({
            locateFile: file => {
                return `https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation@0.1.1629494320/${file}`;
            }
        });
        this.selfieSegmentation.setOptions({
            modelSelection: 1,
            selfieMode: true
        });
        this.selfieSegmentation.onResults(results => this.onSelfieSegmentationResults(results));
    }

    initFilterFromMediaStream(stream: MediaStream) {
        if (this.videoElement && (this.videoElement?.srcObject as MediaStream)?.id !== stream.id) {
            this.logger.debug(`${this.loggerPrefix} camera stream has changed`);
            this.updateCameraStream(stream);
        }
        if (this.canvasStream) {
            return;
        }

        this._canvasWidth = stream.getVideoTracks()[0].getSettings().width;
        this._canvasHeight = stream.getVideoTracks()[0].getSettings().height;

        this.logger.debug(`${this.loggerPrefix} initialising stream for filter`);
        this.videoElement = document.createElement('video');
        this.videoElement.srcObject = stream;

        this.canvasElement = document.createElement('canvas');
        this.canvasElement.width = this._canvasWidth;
        this.canvasElement.height = this._canvasHeight;
        this.canvasCtx = this.canvasElement.getContext('2d');

        this.logger.debug(`${this.loggerPrefix} starting filtered stream`);

        const camera = new Camera(this.videoElement, {
            onFrame: async () => {
                try {
                    if (this.videoElement) {
                        await this.selfieSegmentation.send({ image: this.videoElement });
                    }
                } catch (err) {
                    this.logger.error(`${this.loggerPrefix} failed to send image to self segmentation mask`, err);
                }
            },
            width: this._canvasWidth,
            height: this._canvasHeight
        });
        camera.start();
    }

    updateCameraStream(stream: MediaStream) {
        this.videoElement.srcObject = stream;
    }

    startFilteredStream(): MediaStream {
        this.canvasStream = this.canvasElement.captureStream();
        return this.canvasStream;
    }

    updateFilter(filter: BackgroundFilter | null) {
        this.logger.debug(`${this.loggerPrefix} Updating filter to ${filter}`);
        if (filter) {
            this.preferredFilterCache.set(filter);
            this.activeFilter = filter;
            this.filterOn = true;
            this.logger.debug(`${this.loggerPrefix} Filter on`);
            this._onFilterChanged.next(filter);
        } else {
            this.preferredFilterCache.clear();
            this.activeFilter = null;
            this.filterOn = false;
            this.logger.debug(`${this.loggerPrefix} Filter off`);
            this._onFilterChanged.next(null);
        }
    }

    doesSupportVideoFiltering() {
        return !this.deviceTypeService.isIpad() && !this.deviceTypeService.getBrowserName().includes(browsers.Safari);
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
            this.canvasCtx.filter = 'blur(50px)';
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
