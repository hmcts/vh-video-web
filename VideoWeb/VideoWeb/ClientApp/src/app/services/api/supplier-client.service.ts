import { Inject, Injectable, Renderer2, RendererFactory2 } from '@angular/core';
import { DOCUMENT } from '@angular/common';

@Injectable({
    providedIn: 'root'
})
export class SupplierClientService {
    private readonly vodafone = 'scripts/vodafone/pexrtc.js';
    private readonly kinly = 'scripts/kinly/pexrtc.js';
    private readonly renderer: Renderer2;

    constructor(rendererFactory: RendererFactory2, @Inject(DOCUMENT) private document) {
        this.renderer = rendererFactory.createRenderer(null, null);
    }

    loadSupplierScript(supplier: string) {
        const script = this.renderer.createElement('script');
        switch (supplier) {
            case 'vodafone':
                script.src = this.vodafone;
                break;
            case 'kinly':
                script.src = this.kinly;
                break;
            default:
                throw new Error('Invalid supplier');
        }
        this.renderer.appendChild(this.document.body, script);
    }
}
