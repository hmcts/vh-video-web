import { Inject, Injectable, Renderer2, RendererFactory2 } from '@angular/core';
import { DOCUMENT } from '@angular/common';

@Injectable({
    providedIn: 'root'
})
export class DynatraceService {
    private readonly renderer: Renderer2;

    constructor(
        rendererFactory: RendererFactory2,
        @Inject(DOCUMENT) private readonly document
    ) {
        this.renderer = rendererFactory.createRenderer(null, null);
    }

    addDynatraceScript(scriptUrl) {
        const script = this.renderer.createElement('script');
        script.src = scriptUrl;
        this.document.head.appendChild(script);
    }

    addUserIdentifyScript(userIdendify) {
        const script = this.renderer.createElement('script');
        script.text = "dtrum.identifyUser('" + userIdendify + "')";
        this.document.head.appendChild(script);
    }
}
