import { Injectable } from '@angular/core';
import { Camera } from '@mediapipe/camera_utils';
import { Results, SelfieSegmentation } from '@mediapipe/selfie_segmentation';
import { from, Observable, of, ReplaySubject, Subject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { browsers } from '../shared/browser.constants';
import { ConfigService } from './api/config.service';
import { DeviceTypeService } from './device-type.service';
import { Logger } from './logging/logger-base';
import { BackgroundFilter } from './models/background-filter';

@Injectable({
    providedIn: 'root'
})
export class VideoFilterService {
    videoElement: HTMLVideoElement;
    canvasElement: HTMLCanvasElement;
    canvasStream: MediaStream;
    canvasCtx: CanvasRenderingContext2D;

    selfieSegmentation: SelfieSegmentation;
    activeFilter: BackgroundFilter;
    imgs: Map<string, HTMLImageElement> = new Map();

    private readonly loggerPrefix = '[VideoFilterService] -';
    private _canvasWidth = 1280;
    private _canvasHeight = 720;
    private _enableVideoFilters: boolean;
    private _failCount = 0;
    private _isPillarBox = true;
    private _blurRadius = 20;
    private _filterOn = false;

    private _onFilterChanged = new Subject<BackgroundFilter | null>();
    private filterOnSubject = new ReplaySubject<boolean>(1);

    constructor(
        private logger: Logger,
        private configService: ConfigService,
        private deviceTypeService: DeviceTypeService
    ) {
        this.configService.getClientSettings().subscribe(settings => {
            this._enableVideoFilters = settings.enable_video_filters;
            if (settings.blur_radius) {
                this.logger.debug(`${this.loggerPrefix} Loaded blur radius from config - ${settings.blur_radius}px`);
                this.blurRadius = settings.blur_radius;
            }
        });

        this.filterOn = false;
        this.activeFilter = null;
        this.filterOnSubject.next(this.filterOn);

        this.selfieSegmentation = new SelfieSegmentation({
            locateFile: file => `https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation@0.1.1632777926/${file}`
        });
        this.selfieSegmentation.setOptions({
            modelSelection: 1,
            selfieMode: false
        });
        this.selfieSegmentation.onResults(results => this.onSelfieSegmentationResults(results));
    }

    get blurRadius(): number {
        return this._blurRadius;
    }

    get filterOn(): boolean {
        return this._filterOn;
    }

    get onFilterChanged$(): Observable<BackgroundFilter | null> {
        return this._onFilterChanged.asObservable();
    }

    get filterOn$(): Observable<boolean> {
        return this.filterOnSubject.asObservable();
    }

    set blurRadius(str: number) {
        this._blurRadius = str;
    }

    set filterOn(on: boolean) {
        if (this._filterOn === on) {
            return;
        }

        this._filterOn = on;
        this.filterOnSubject.next(this._filterOn);
    }

    initFilterFromMediaStream(stream: MediaStream): Observable<void> {
        if (this.videoElement && (this.videoElement?.srcObject as MediaStream)?.id !== stream.id) {
            this.logger.debug(`${this.loggerPrefix} camera stream has changed`);
            this.updateCameraStream(stream);
        }
        if (this.canvasStream) {
            this.logger.debug(`${this.loggerPrefix} canvas already exists returning`);
            return of(void 0);
        }

        this.updateCanvasSize(stream);

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
                    if (this._failCount < 3) {
                        this._failCount++;
                        this.selfieSegmentation.reset();
                    } else {
                        this.logger.error(
                            `${this.loggerPrefix} failed to send image to self segmentation mask multiple times. Turning filter off`,
                            err
                        );
                        this.updateFilter(null);
                    }
                }
            },
            width: 1280,
            height: 720
        });

        return from(camera.start()).pipe(
            tap(() => {
                this.videoElement.srcObject = stream;
            })
        );
    }

    updateCameraStream(stream: MediaStream) {
        this.videoElement.srcObject = stream;
        this.canvasElement.width = this._canvasWidth;
        this.canvasElement.height = this._canvasHeight;
    }

    updateCanvasSize(stream: MediaStream) {
        const settings = stream.getVideoTracks()[0].getSettings();
        this.checkCameraStreamAspectRatio(settings);

        this._canvasWidth = settings.width;
        this._canvasHeight = settings.height;
    }

    checkCameraStreamAspectRatio(settings: MediaTrackSettings) {
        const sixteenByNineAspectRatio = '1.78';
        const aspectRatio = settings.aspectRatio.toFixed(2);
        this._isPillarBox = aspectRatio !== sixteenByNineAspectRatio;
    }

    startFilteredStream(): MediaStream {
        this.canvasStream = this.canvasElement.captureStream();
        return this.canvasStream;
    }

    updateFilter(filter: BackgroundFilter | null) {
        this.logger.debug(`${this.loggerPrefix} Updating filter to ${filter}`);
        if (filter) {
            this.startMonitoringLostGlContext();
            this.selfieSegmentation.reset();
            this._failCount = 0;
            this.activeFilter = filter;
            this.filterOn = true;
            this.logger.debug(`${this.loggerPrefix} Filter on`);
            this._onFilterChanged.next(filter);
        } else {
            this.activeFilter = null;
            this._failCount = 0;
            this.filterOn = false;
            this.stopMonitoringLostGlContext();
            this.logger.debug(`${this.loggerPrefix} Filter off`);
            this._onFilterChanged.next(null);
        }
    }

    isFeatureEnabled() {
        return this._enableVideoFilters;
    }

    doesSupportVideoFiltering() {
        if (!this._enableVideoFilters) {
            this.logger.debug(`${this.loggerPrefix} Custom backgrounds not supported - feature is disabled`);
            return false;
        }

        const allowedBrowser = !this.deviceTypeService.getBrowserName().includes(browsers.Safari);
        if (!allowedBrowser) {
            this.logger.debug(`${this.loggerPrefix} Custom backgrounds not supported - Browser is not supported for video filtering`);
            return false;
        }

        if (!this.isWebGL2Supported()) {
            this.logger.debug(`${this.loggerPrefix} Custom backgrounds not supported - WebGl2 is not supported on client`);
            return false;
        }

        if (!this.deviceTypeService.isDesktop()) {
            this.logger.debug(`${this.loggerPrefix} Custom backgrounds not supported - Client is not a desktop`);
            return false;
        }

        this.logger.debug(`${this.loggerPrefix} Custom backgrounds supported`);
        return true;
    }
    /* eslint-disable no-console */
    startMonitoringLostGlContext() {
        if (console.defaultWarn) {
            return;
        }
        const self = this;
        console.defaultWarn = console.warn.bind(console);
        console.warn = function () {
            // default &  console.warn()
            console.defaultWarn.apply(...arguments);
            // new & array data
            const args = Array.from(arguments);
            if (args.find(a => a.includes('CONTEXT_LOST_WEBGL')) && self.selfieSegmentation) {
                self.logger.info(`${this.loggerPrefix} WEBGL context lost, resetting segmentation`);
                self.selfieSegmentation.reset();
            }
        };
    }

    stopMonitoringLostGlContext() {
        console.warn = console.defaultWarn;
        console.defaultWarn = null;
    }
    /* eslint-enable no-console */

    private isWebGL2Supported = () => !!document.createElement('canvas').getContext('webgl2');

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
        let imageName = '';
        if (this.activeFilter === BackgroundFilter.HMCTS) {
            imageName = 'VhBgFilterHMCTS';
        } else if (this.activeFilter === BackgroundFilter.SCTS) {
            imageName = 'VhBgFilterSCTS';
        }

        if (this._isPillarBox) {
            imageName += '_pillarbox';
        }

        if (this.imgs.has(imageName)) {
            return this.imgs.get(imageName);
        }

        const imagePath = `/assets/images/${imageName}.jpg`;

        this.logger.debug(`${this.loggerPrefix} retrieving image for filter ${this.activeFilter} from ${imagePath}`);
        // With Background image
        const imageObject = new Image();
        imageObject.src = imagePath;
        this.imgs.set(imageName, imageObject);
        return imageObject;
    }
}
