import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import '@angular/compiler';
import 'webrtc-adapter';

import { AppModule } from './app/app.module';
import { environment } from './environments/environment';
import { initAll } from 'govuk-frontend';

export function getBaseUrl() {
    return document.getElementsByTagName('base')[0].href;
}

const providers = [{ provide: 'BASE_URL', useFactory: getBaseUrl, deps: [] }];

if (environment.production) {
    enableProdMode();
}
initAll();
platformBrowserDynamic(providers)
    .bootstrapModule(AppModule)
    .catch(err => console.error(err));
