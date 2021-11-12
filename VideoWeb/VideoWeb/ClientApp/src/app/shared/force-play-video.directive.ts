import { AfterViewInit, Directive, ElementRef, Input, OnChanges, OnInit, Renderer2, RendererFactory2, SimpleChanges } from '@angular/core';
import { Logger } from '../services/logging/logger-base';

@Directive({
    selector: '[appForcePlayVideo]'
})
export class ForcePlayVideoDirective implements OnInit, OnChanges, AfterViewInit {
    private readonly loggerPrefix = '[ForcePlayVideoDirective] -';
    private renderer: Renderer2;
    @Input() mute: boolean | null = null;
    private unsubscribeFromMouseDownCallback: () => void;
    private unsubscribeFromTouchStartCallback: () => void;

    private get videoElement(): HTMLVideoElement {
        return this.elementRef.nativeElement as HTMLVideoElement;
    }

    constructor(private elementRef: ElementRef, renderer2Factory: RendererFactory2, private logger: Logger) {
        this.renderer = renderer2Factory.createRenderer(null, null);
    }

    ngOnInit(): void {
        this.configureVideoElement();
        this.addEventListeners();
    }

    ngAfterViewInit(): void {
        this.videoElement.play();

        setTimeout(() => {
            this.videoElement.play();
        }, 5000);
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['mute']?.currentValue !== changes['mute']?.previousValue) {
            this.updateMute();
        }
    }

    private configureVideoElement() {
        this.logger.info(`${this.loggerPrefix} - configureVideoElement - adding playsinline and autoplay attributes.`);
        this.renderer.setAttribute(this.videoElement, 'playsinline', 'true');
        this.renderer.setAttribute(this.videoElement, 'autoplay', 'true');

        this.updateMute();
    }

    private updateMute() {
        if (!!this.mute) {
            this.renderer.setAttribute(this.videoElement, 'muted', 'true');
        } else {
            this.renderer.setAttribute(this.videoElement, 'muted', 'false');
        }
    }

    private addEventListeners() {
        this.logger.info(`${this.loggerPrefix} - addEventListeners - adding mousedown handler.`);
        this.unsubscribeFromMouseDownCallback = this.renderer.listen('window', 'mousedown', this.onMouseDownOrTouchStart.bind(this));
        this.logger.info(`${this.loggerPrefix} - addEventListeners - adding touchstart handler.`);
        this.unsubscribeFromTouchStartCallback = this.renderer.listen('window', 'touchstart', this.onMouseDownOrTouchStart.bind(this));
    }

    private onMouseDownOrTouchStart() {
        this.logger.info(`${this.loggerPrefix} - onMouseDownOrTouchStart - playing video.`);
        this.videoElement.play();
        this.unsubscribeFromMouseDownCallback();
        this.unsubscribeFromTouchStartCallback();
    }
}
