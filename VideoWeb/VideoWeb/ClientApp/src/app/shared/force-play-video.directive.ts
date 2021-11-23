import { Directive, ElementRef, OnInit, Renderer2, RendererFactory2 } from '@angular/core';
import { Logger } from '../services/logging/logger-base';

@Directive({
    selector: '[appForcePlayVideo]'
})
export class ForcePlayVideoDirective implements OnInit {
    private readonly loggerPrefix = '[ForcePlayVideoDirective] -';
    private renderer: Renderer2;
    private unsubscribeFromMouseDownCallback: () => void;
    private unsubscribeFromTouchStartCallback: () => void;

    public get videoElement(): HTMLVideoElement {
        return this.elementRef.nativeElement as HTMLVideoElement;
    }

    constructor(private elementRef: ElementRef, renderer2Factory: RendererFactory2, private logger: Logger) {
        this.renderer = renderer2Factory.createRenderer(null, null);
    }

    ngOnInit(): void {
        this.configureVideoElement();
        this.addEventListeners();
    }

    private configureVideoElement() {
        this.logger.info(`${this.loggerPrefix} - configureVideoElement - adding playsinline and autoplay attributes.`);
        this.renderer.setAttribute(this.videoElement, 'playsinline', 'true');
        this.renderer.setAttribute(this.videoElement, 'autoplay', 'true');
    }

    private addEventListeners() {
        this.logger.info(`${this.loggerPrefix} - addEventListeners - adding mousedown handler.`);
        this.unsubscribeFromMouseDownCallback = this.renderer.listen('window', 'mousedown', this.onMouseDownOrTouchStart.bind(this));
        this.logger.info(`${this.loggerPrefix} - addEventListeners - adding touchstart handler.`);
        this.unsubscribeFromTouchStartCallback = this.renderer.listen('window', 'touchstart', this.onMouseDownOrTouchStart.bind(this));

        this.videoElement.oncanplay = event => {
            this.logger.info(`${this.loggerPrefix} - videoElement.oncanplay - playing video`);
            this.videoElement.play();
        };
    }

    private onMouseDownOrTouchStart() {
        this.logger.info(`${this.loggerPrefix} - onMouseDownOrTouchStart - playing video.`);
        this.videoElement.play();
        this.unsubscribeFromMouseDownCallback();
        this.unsubscribeFromTouchStartCallback();
    }
}
