import { Injectable } from '@angular/core';
import { Camera } from '@mediapipe/camera_utils';
import { Results, SelfieSegmentation } from '@mediapipe/selfie_segmentation';
import { Observable, ReplaySubject, Subject } from 'rxjs';
import { browsers } from '../shared/browser.constants';
import { ConfigService } from './api/config.service';
import { DeviceTypeService } from './device-type.service';
import { Logger } from './logging/logger-base';
import { BackgroundFilter } from './models/background-filter';
import { SessionStorage } from './session-storage';

@Injectable({
    providedIn: 'root'
})
export class VideoFilterService {
    private readonly loggerPrefix = '[VideoFilterService] -';

    private _canvasWidth = 640;
    private _canvasHeight = 480;
    private _enableVideoFilters: boolean;

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

    private _filterOn = false;
    set filterOn(on: boolean) {
        if (this._filterOn === on) {
            return;
        }

        this._filterOn = on;
        this.filterOnSubject.next(this._filterOn);
    }

    get filterOn(): boolean {
        return this._filterOn;
    }

    private filterOnSubject = new ReplaySubject<boolean>(1);
    get filterOn$(): Observable<boolean> {
        return this.filterOnSubject.asObservable();
    }

    private _blurRadius = 20;
    get blurRadius(): number {
        return this._blurRadius;
    }

    set blurRadius(str: number) {
        this._blurRadius = str;
    }

    selfieSegmentation: SelfieSegmentation;
    activeFilter: BackgroundFilter;
    imgs: Map<BackgroundFilter, HTMLImageElement> = new Map();

    constructor(private logger: Logger, private configService: ConfigService, private deviceTypeService: DeviceTypeService) {
        this.configService.getClientSettings().subscribe(settings => {
            this._enableVideoFilters = settings.enable_video_filters;
            if (settings.blur_radius) {
                this.logger.debug(`${this.loggerPrefix} Loaded blur radius from config - ${settings.blur_radius}px`);
                this.blurRadius = settings.blur_radius;
            }
        });
        this.preferredFilterCache = new SessionStorage(this.PREFERRED_FILTER_KEY);

        if (!this.preferredFilterCache.get()) {
            this.filterOn = false;
            this.activeFilter = null;
        } else {
            this.activeFilter = this.preferredFilterCache.get();
            this.filterOn = true;
        }

        this.filterOnSubject.next(this.filterOn);

        this.selfieSegmentation = new SelfieSegmentation({
            locateFile: file => {
                return `https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation@0.1.1629494320/${file}`;
            }
        });
        this.selfieSegmentation.setOptions({
            modelSelection: 1,
            selfieMode: false
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

        const settings = stream.getVideoTracks()[0].getSettings();
        this._canvasWidth = settings.width / settings.aspectRatio;
        this._canvasHeight = settings.height / settings.aspectRatio;

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
        const settings = stream.getVideoTracks()[0].getSettings();
        this._canvasWidth = settings.width / settings.aspectRatio;
        this._canvasHeight = settings.height / settings.aspectRatio;
        this.canvasElement.width = this._canvasWidth;
        this.canvasElement.height = this._canvasHeight;
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

    isFeatureEnabled() {
        return this._enableVideoFilters;
    }

    doesSupportVideoFiltering() {
        const allowedBrowser = !this.deviceTypeService.getBrowserName().includes(browsers.Safari);
        return this._enableVideoFilters && allowedBrowser && this.deviceTypeService.isDesktop();
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
            this.canvasCtx.filter = `blur(${this.blurRadius}px)`;
        }
        this.canvasCtx.drawImage(results.image, 0, 0, this.canvasElement.width, this.canvasElement.height);
    }

    private applyVirtualBackgroundEffect() {
        const imageObject = this.getImageForBackground();
        this.canvasCtx.imageSmoothingEnabled = true;
        this.canvasCtx.drawImage(
            imageObject,
            0,
            0,
            imageObject.width,
            imageObject.height,
            0,
            0,
            this.canvasElement.width,
            this.canvasElement.height
        );
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
