import { AfterViewInit, Directive, ElementRef, Input, Renderer2, RendererFactory2 } from '@angular/core';
import { Logger } from '../services/logging/logger-base';

@Directive({
    selector: '[appForcePlayVideo]'
})
export class ForcePlayVideoDirective implements AfterViewInit {
    private readonly loggerPrefix = '[ForcePlayVideoDirective] -';
    private renderer: Renderer2;
    @Input() mute: boolean | null = null;

    private get videoElement(): HTMLVideoElement {
        return this.elementRef.nativeElement as HTMLVideoElement;
    }

    constructor(private elementRef: ElementRef, renderer2Factory: RendererFactory2, private logger: Logger) {
        this.renderer = renderer2Factory.createRenderer(null, null);

        this.configureVideoElement();
        this.addEventListeners();
    }

    ngAfterViewInit(): void {
        this.videoElement.play();

        setTimeout(() => {
            this.videoElement.play();
        }, 5000);
    }

    private configureVideoElement() {
        this.logger.info(`${this.loggerPrefix} - configureVideoElement - adding playsinline and autoplay attributes.`);
        this.renderer.setAttribute(this.videoElement, 'playsinline', 'true');
        this.renderer.setAttribute(this.videoElement, 'autoplay', 'true');
        this.renderer.setAttribute(
            this.videoElement,
            'poster',
            // TODO: REMOVE
            'https://i.guim.co.uk/img/media/f1459b35b58255f2ee15e63e34e3b04a07e8825e/296_0_1328_797/master/1328.jpg?width=1200&height=1200&quality=85&auto=format&fit=crop&s=9a2675dd0648b61c2ce4f9021f9ad7e7'
        );

        if (!!this.mute) {
            this.renderer.setAttribute(this.videoElement, 'muted', 'true');
        }
    }

    private addEventListeners() {
        this.logger.info(`${this.loggerPrefix} - addEventListeners - adding click handler.`);
        this.renderer.listen('window', 'click', this.onWindowClick.bind(this));
    }

    private onWindowClick() {
        this.logger.info(`${this.loggerPrefix} - onWindowClick - playing video.`);
        this.videoElement.play();
    }
}
