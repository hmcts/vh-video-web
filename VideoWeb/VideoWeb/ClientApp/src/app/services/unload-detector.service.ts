import { Injectable, Renderer2, RendererFactory2 } from '@angular/core';
import { DeviceDetectorService } from 'ngx-device-detector';
import { Observable, Subject } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { Logger } from './logging/logger-base';

@Injectable({
    providedIn: 'root'
})
export class UnloadDetectorService {
    private loggerPrefix = '[UnloadDetectorService] -';
    private hasEmittedUnload = false;
    private visibilityChangeSubject = new Subject<boolean>();
    private pageHiddenSubject = new Subject<void>();
    private shouldUnloadSubject = new Subject<void>();
    private shouldReloadSubject = new Subject<void>();
    private beforeUnloadSubject = new Subject<void>();
    private renderer: Renderer2;

    constructor(deviceDetectorService: DeviceDetectorService, renderer2Factory: RendererFactory2, private logger: Logger) {
        this.renderer = renderer2Factory.createRenderer(null, null);
        this.initialise(deviceDetectorService.isDesktop());
    }

    get shouldUnload(): Observable<void> {
        return this.shouldUnloadSubject.asObservable();
    }

    get shouldReload(): Observable<void> {
        return this.shouldReloadSubject.asObservable();
    }

    private get beforeUnload(): Observable<void> {
        return this.beforeUnloadSubject.asObservable();
    }

    private get visibilityChange(): Observable<boolean> {
        return this.visibilityChangeSubject.asObservable();
    }

    private get pageHidden(): Observable<void> {
        return this.pageHiddenSubject.asObservable();
    }

    private get visibilityChangedToHidden(): Observable<void> {
        return this.visibilityChange.pipe(
            filter(value => value === true),
            map(() => void 0)
        );
    }

    private get visibilityChangedToVisible(): Observable<void> {
        return this.visibilityChange.pipe(
            filter(value => value === false),
            map(() => void 0)
        );
    }

    private initialise(isDesktop: boolean) {
        if (isDesktop) {
            this.initialiseEventHandlersForDesktopDevices();
        } else {
            this.initialiseEventHandlersForMobileDevices();
        }
    }

    private initialiseEventHandlersForDesktopDevices() {
        this.logger.debug(`${this.loggerPrefix} Desktop device detected. Will raise unload event when window:beforeunload is raised!`);

        this.renderer.listen('window', 'beforeunload', () => this.beforeUnloadSubject.next());
        this.beforeUnload.subscribe(() => {
            this.logger.debug(`${this.loggerPrefix} window:beforeunload recieved. Emitting the should unload event!`);
            this.shouldUnloadSubject.next();
            this.hasEmittedUnload = true;
        });
    }

    private initialiseEventHandlersForMobileDevices() {
        this.logger.debug(
            `${this.loggerPrefix} Mobile device detected. Will raise unload/reload events when document:visibilitychange and unload when window:pagehide is raised!`
        );

        this.renderer.listen('document', 'visibilitychange', () => this.visibilityChangeSubject.next(document.hidden));
        this.renderer.listen('window', 'pagehide', () => this.pageHiddenSubject.next());

        this.visibilityChangedToHidden.subscribe(() => {
            this.logger.debug(`${this.loggerPrefix} Visibility changed to hidden. Emitting the should unload event!`);
            this.shouldUnloadSubject.next();
            this.hasEmittedUnload = true;
        });

        this.pageHidden.subscribe(() => {
            this.logger.debug(`${this.loggerPrefix} Page hidden changed to hidden. Emitting the should unload event!`);
            this.shouldUnloadSubject.next();
            this.hasEmittedUnload = true;
        });

        this.visibilityChangedToVisible.pipe(filter(() => this.hasEmittedUnload)).subscribe(() => {
            this.logger.debug(`${this.loggerPrefix} Visibility changed to visible. Emitting the should reload event!`);
            this.shouldReloadSubject.next();
            this.hasEmittedUnload = false;
        });
    }
}
