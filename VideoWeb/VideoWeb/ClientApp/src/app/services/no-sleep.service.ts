import { Injectable, Renderer2, RendererFactory2 } from '@angular/core';
import { DeviceDetectorService } from 'ngx-device-detector';
import { Observable, Subject } from 'rxjs';
import { take } from 'rxjs/operators';
import { Logger } from './logging/logger-base';
import { UserMediaStreamService } from './user-media-stream.service';

@Injectable({
    providedIn: 'root'
})
export class NoSleepService {
    private loggerPrefix = '[NoSleepService] -';
    private currentStream: MediaStream;
    private videoElement: HTMLVideoElement;
    private renderer: Renderer2;
    private touchStartSubject = new Subject<void>();

    private get touchStart$(): Observable<void> {
        return this.touchStartSubject.asObservable();
    }

    constructor(
        private userMediaStreamService: UserMediaStreamService,
        renderer2Factory: RendererFactory2,
        private deviceService: DeviceDetectorService,
        private document: Document,
        private logger: Logger
    ) {
        this.renderer = renderer2Factory.createRenderer(null, null);
        this.renderer.listen(window, 'touchstart', () => this.touchStartSubject.next());
        this.userMediaStreamService.currentStream$.subscribe(stream => {
            this.onStreamChange(stream);
        });
    }

    enable() {
        this.logger.debug(`${this.loggerPrefix} enabling no sleep`);

        if (this.videoElement) {
            this.logger.warn(`${this.loggerPrefix} no sleep is already enabled`);
            return;
        }

        this.videoElement = this.document.createElement('video');
        this.videoElement.muted = true;
        this.videoElement.setAttribute('playsInLine', 'true');
        this.videoElement.style.opacity = '0%';
        this.videoElement.style.top = '0';
        this.videoElement.style.width = '100px';
        this.videoElement.style.height = '100px';
        this.videoElement.style.position = 'absolute';
        this.videoElement.style.pointerEvents = 'none';
        this.videoElement.srcObject = this.currentStream;
        const firstDiv = this.document.getElementsByTagName('div')[0];
        firstDiv.appendChild(this.videoElement);

        this.logger.debug(`${this.loggerPrefix} created video element`);

        if (this.deviceService.isDesktop()) {
            this.logger.debug(`${this.loggerPrefix} desktop mode - starting immediatley`);
            this.start();
        } else {
            this.logger.debug(`${this.loggerPrefix} NOT desktop mode - starting after first touch`);
            this.touchStart$.pipe(take(1)).subscribe(() => this.start());
        }
    }

    private start() {
        this.logger.info(`${this.loggerPrefix} starting`);
        this.videoElement.play();
    }

    disable() {
        this.logger.info(`${this.loggerPrefix} disabled`);
        this.videoElement?.parentElement?.removeChild(this.videoElement);
        this.videoElement = null;
    }

    onStreamChange(stream: MediaStream): void {
        this.logger.debug(`${this.loggerPrefix} updating stream`);
        this.currentStream = stream;
        if (this.videoElement) this.videoElement.srcObject = this.currentStream;
    }
}
