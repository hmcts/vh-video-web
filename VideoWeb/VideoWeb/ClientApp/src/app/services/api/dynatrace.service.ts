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

    /**
     * The function `addDynatraceScript` dynamically adds a script element with a specified URL to the
     * document's head.
     * @param scriptUrl - The `scriptUrl` parameter is a string that represents the URL of the
     * Dynatrace script that you want to add dynamically to the HTML document.
     */
    addDynatraceScript(scriptUrl) {
        const script = this.renderer.createElement('script');
        script.src = scriptUrl;
        this.document.head.appendChild(script);
    }

    /**
     * The function `addUserIdentifyScript` creates a script element to identify a user with a given
     * ID.
     * @param userIdentify - The `userIdendify` parameter is the user identifier that will be passed to
     * the `dtrum.identifyUser` function in the `addUserIdentifyScript` method. This identifier is used
     * to uniquely identify a user within the Dynatrace monitoring system.
     */
    addUserIdentifier(userIdentify) {
        if (this.isUserIdentifyScriptAlreadyLoaded()) {
            return;
        }
        const script = this.renderer.createElement('script');
        script.text = 'dtrum.identifyUser("' + userIdentify + '")';
        this.document.head.appendChild(script);
    }

    isUserIdentifyScriptAlreadyLoaded(): boolean {
        // Select all <script> tags in the document
        const scripts = this.document.querySelectorAll('script');

        // Iterate through the script elements to search for 'dtrum.identifyUser'
        let scriptFound = false;
        scripts.forEach(script => {
            if (script.textContent.includes('dtrum.identifyUser')) {
                scriptFound = true;
            }
        });

        return scriptFound;
    }
}
