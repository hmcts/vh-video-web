import { Injectable, Renderer2, RendererFactory2 } from '@angular/core';
import { DeviceDetectorService } from 'ngx-device-detector';
import { Observable } from 'rxjs';
import { Subject } from 'rxjs';
import { filter } from 'rxjs/operators';

@Injectable({
    providedIn: 'root'
})
export class UnloadDetectorService {
    private visibilityChangeSubject = new Subject<boolean>();
    private shouldUnloadSubject = new Subject<void>();
    private beforeUnloadSubject = new Subject<void>();

    private renderer: Renderer2;
    isDesktop: boolean;

    constructor(private deviceDetectorService: DeviceDetectorService, renderer2Factor: RendererFactory2) {
        this.renderer = renderer2Factor.createRenderer(null, null);
        this.initialise();
    }

    private initialise() {
        this.isDesktop = this.deviceDetectorService.isDesktop();

        if (this.isDesktop) {
            this.renderer.listen('window', 'beforeunload', () => this.beforeUnloadSubject.next());
            this.beforeUnload.subscribe(() => this.shouldUnloadSubject.next());
        } else {
            this.renderer.listen('document', 'visibilitychange', () => this.visibilityChangeSubject.next(document.hidden));
            this.visibilityChangedToHidden.subscribe(() => this.shouldUnloadSubject.next());
        }
    }

    get shouldUnload(): Observable<void> {
        return this.shouldUnloadSubject.asObservable();
    }

    private get visibilityChangedToHidden() {
        return this.visibilityChange.pipe(filter(value => value === true));
    }

    private get visibilityChange(): Observable<boolean> {
        return this.visibilityChangeSubject.asObservable();
    }

    private get beforeUnload(): Observable<void> {
        return this.beforeUnloadSubject.asObservable();
    }
}
