import { Inject, Injectable, Renderer2, RendererFactory2 } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { Supplier } from '../clients/api-client';

@Injectable({
    providedIn: 'root'
})
export class SupplierClientService {
    private readonly vodafone = 'scripts/vodafone/pexrtc.js';
    private readonly kinly = 'scripts/kinly/pexrtc.js';
    private readonly renderer: Renderer2;

    constructor(
        rendererFactory: RendererFactory2,
        @Inject(DOCUMENT) private document
    ) {
        this.renderer = rendererFactory.createRenderer(null, null);
    }

    loadSupplierScript(supplier: Supplier) {
        let scriptSrc: string;
        switch (supplier) {
            case Supplier.Vodafone:
                scriptSrc = this.vodafone;
                break;
            case Supplier.Kinly:
                scriptSrc = this.kinly;
                break;
            default:
                throw new Error('Invalid supplier');
        }

        this.removeExistingScripts(scriptSrc);

        if (this.isScriptAlreadyLoaded(scriptSrc)) {
            return;
        }

        this.loadNewScript(scriptSrc);
    }

    private removeExistingScripts(currentScriptSrc: string) {
        const existingScripts = Array.from(this.document.querySelectorAll('script[src$="pexrtc.js"]')) as HTMLScriptElement[];
        existingScripts.forEach(script => {
            if (script.getAttribute('src') !== currentScriptSrc) {
                this.renderer.removeChild(this.document.body, script);
            }
        });
    }

    private isScriptAlreadyLoaded(scriptSrc: string): boolean {
        return !!this.document.querySelector(`script[src="${scriptSrc}"]`);
    }

    private loadNewScript(scriptSrc: string) {
        const script = this.renderer.createElement('script');
        script.src = scriptSrc;
        this.renderer.appendChild(this.document.body, script);
    }
}
