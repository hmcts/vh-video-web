import { Directive, ElementRef, OnDestroy, OnInit, Renderer2, RendererFactory2 } from '@angular/core';
import { Logger } from '../services/logging/logger-base';

@Directive({
    selector: '[appForcePlayVideo]'
})
export class ForcePlayVideoDirective implements OnInit, OnDestroy {
    private readonly loggerPrefix = '[ForcePlayVideoDirective] -';
    private renderer: Renderer2;
    private unsubscribeFromMouseDownCallback: () => void | null = null;
    private unsubscribeFromTouchStartCallback: () => void | null = null;

    private destroyed = false;
    private isPlaying = false;

    constructor(private elementRef: ElementRef, renderer2Factory: RendererFactory2, private logger: Logger) {
        this.renderer = renderer2Factory.createRenderer(null, null);
    }

    public get videoElement(): HTMLVideoElement {
        return this.elementRef.nativeElement as HTMLVideoElement;
    }

    ngOnInit(): void {
        this.configureVideoElement();
        this.addEventListeners();
    }

    ngOnDestroy(): void {
        this.logger.debug(`${this.loggerPrefix} - ngOnDestroy - unsubscribing from remaining listeners.`);
        if (this.unsubscribeFromMouseDownCallback) {
            this.logger.debug(`${this.loggerPrefix} - ngOnDestroy - unsubscribing from mouse down callback.`);
            this.unsubscribeFromMouseDownCallback();
            this.unsubscribeFromMouseDownCallback = null;
        }

        if (this.unsubscribeFromTouchStartCallback) {
            this.logger.debug(`${this.loggerPrefix} - ngOnDestroy - unsubscribing from touch start callback.`);
            this.unsubscribeFromTouchStartCallback();
            this.unsubscribeFromTouchStartCallback = null;
        }
        if (this.isPlaying) {
            this.videoElement.pause();
            this.isPlaying = false;
        }
        this.destroyed = true;
    }

    private configureVideoElement() {
        this.logger.debug(`${this.loggerPrefix} - configureVideoElement - adding playsinline and autoplay attributes.`);
        this.renderer.setAttribute(this.videoElement, 'playsinline', 'true');
        this.renderer.setAttribute(this.videoElement, 'autoplay', 'true');
    }

    private playVideo() {
        if (!this.isPlaying) {
            const isPlayingElem =
                this.videoElement.currentTime > 0 &&
                !this.videoElement.paused &&
                !this.videoElement.ended &&
                this.videoElement.readyState > this.videoElement.HAVE_CURRENT_DATA;
            if (isPlayingElem) {
                return;
            }
            this.videoElement.play().catch(error => {
                this.logger.error(`${this.loggerPrefix} - error playing video.`, error);
            });
        }
    }

    private addEventListeners() {
        this.logger.debug(`${this.loggerPrefix} - addEventListeners - adding mousedown handler.`);
        this.unsubscribeFromMouseDownCallback = this.renderer.listen('window', 'mousedown', this.onMouseDownOrTouchStart.bind(this));
        this.logger.debug(`${this.loggerPrefix} - addEventListeners - adding touchstart handler.`);
        this.unsubscribeFromTouchStartCallback = this.renderer.listen('window', 'touchstart', this.onMouseDownOrTouchStart.bind(this));

        this.videoElement.onerror = event => {
            this.logger.warn(`${this.loggerPrefix} - videoElement.onError - event triggered`, event);
            this.isPlaying = false;
        };
        this.videoElement.onplaying = event => {
            this.logger.debug(`${this.loggerPrefix} - videoElement.onplaying - event triggered`);
            this.isPlaying = true;
        };
        this.videoElement.onpause = event => {
            this.logger.debug(`${this.loggerPrefix} - videoElement.onpause - event triggered`);
            this.isPlaying = false;
        };
        this.videoElement.oncanplay = event => {
            this.logger.debug(`${this.loggerPrefix} - videoElement.oncanplay - event triggered`);

            if (!this.destroyed) {
                this.logger.debug(`${this.loggerPrefix} - videoElement.oncanplay - playing video`);
                this.playVideo();
            }
        };
    }

    private onMouseDownOrTouchStart() {
        this.logger.debug(`${this.loggerPrefix} - onMouseDownOrTouchStart - playing video.`);
        this.playVideo();

        this.logger.debug(`${this.loggerPrefix} - onMouseDownOrTouchStart - unsubscribing from mouse down callback.`);
        this.unsubscribeFromMouseDownCallback();
        this.unsubscribeFromMouseDownCallback = null;

        this.logger.debug(`${this.loggerPrefix} - onMouseDownOrTouchStart - unsubscribing from touch start callback.`);
        this.unsubscribeFromTouchStartCallback();
        this.unsubscribeFromTouchStartCallback = null;
    }
}
