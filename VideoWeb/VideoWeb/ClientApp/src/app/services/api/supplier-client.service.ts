import { Inject, Injectable, Renderer2, RendererFactory2 } from '@angular/core';
import { FEATURE_FLAGS, LaunchDarklyService } from '../launch-darkly.service';
import { DOCUMENT } from '@angular/common';

@Injectable({
    providedIn: 'root'
})
export class SupplierClientService {
    isVodafoneToggledOn: boolean;
    private readonly vodafone = 'scripts/vodafone/pexrtc.js';
    private readonly kinly = 'scripts/kinly/pexrtc.js';
    private readonly renderer: Renderer2;

    constructor(private launchDarklyService: LaunchDarklyService, rendererFactory: RendererFactory2, @Inject(DOCUMENT) private document) {
        this.renderer = rendererFactory.createRenderer(null, null);
        this.launchDarklyService.getFlag<boolean>(FEATURE_FLAGS.vodafone).subscribe(flag => (this.isVodafoneToggledOn = flag));
    }

    async loadSupplierScript() {
        const script = this.renderer.createElement('script');
        script.src = this.isVodafoneToggledOn ? this.vodafone : this.kinly;
        this.renderer.appendChild(this.document.body, script);
    }
}
