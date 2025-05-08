import { HttpClient, HttpXhrBackend } from '@angular/common/http';
import { APP_ID, APP_INITIALIZER, ErrorHandler, LOCALE_ID, NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrowserModule, Title } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HomeComponent } from './home/home.component';
import { OnTheDayModule } from './on-the-day/on-the-day.module';
import { SecurityModule } from './security/security.module';
import { ConfigService } from './services/api/config.service';
import { API_BASE_URL, Supplier } from './services/clients/api-client';
import { PageTrackerService } from './services/page-tracker.service';
import { ParticipantStatusUpdateService } from './services/participant-status-update.service';
import { GlobalErrorHandler } from './shared/providers/global-error-handler';
import { SharedModule } from './shared/shared.module';
import { WaitingSpaceModule } from './waiting-space/waiting-space.module';
import { TranslateModule, TranslateLoader, MissingTranslationHandler } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { DisplayMissingTranslationHandler } from './shared/display-missing-translation-handler';
import { registerLocaleData } from '@angular/common';
import localeCy from '@angular/common/locales/cy';
import { AuthConfigModule } from './auth-config.module';
import { NavigatorComponent } from './home/navigator/navigator.component';

import { StoreModule } from '@ngrx/store';
import { StoreRouterConnectingModule, routerReducer } from '@ngrx/router-store';
import { StoreDevtoolsModule } from '@ngrx/store-devtools';
import { EFFECTS_ERROR_HANDLER, EffectsModule } from '@ngrx/effects';
import { DynatraceService } from './services/api/dynatrace.service';
import { SupplierClientService } from './services/api/supplier-client.service';
import { CookieBannerComponent } from './shared/cookie-banner/cookie-banner.component';
import { VHGlobalEffectsErrorHandler } from './waiting-space/store/vh-global-effects-error-handler';
import { environment } from 'src/environments/environment';

export function createTranslateLoader() {
    // We cant inject a httpClient because it has a race condition with adal
    // resulting in a null context when trying to load the translatons
    const httpClient = new HttpClient(new HttpXhrBackend({ build: () => new XMLHttpRequest() }));
    return new TranslateHttpLoader(httpClient, './assets/i18n/', '.json');
}

export function loadDefaultPexipClient(supplierClientService: SupplierClientService) {
    return () => supplierClientService.loadSupplierScript(Supplier.Vodafone);
}

export function getLocale() {
    const language = localStorage.getItem('language') ?? 'en';
    return language === 'tl' ? 'cy' : language;
}

@NgModule({
    declarations: [AppComponent, HomeComponent, NavigatorComponent, CookieBannerComponent],
    imports: [
        BrowserModule,
        FormsModule,
        SharedModule,
        SecurityModule,
        WaitingSpaceModule,
        OnTheDayModule,
        AppRoutingModule,
        BrowserAnimationsModule,
        TranslateModule.forRoot({
            missingTranslationHandler: { provide: MissingTranslationHandler, useClass: DisplayMissingTranslationHandler },
            loader: {
                provide: TranslateLoader,
                useFactory: createTranslateLoader
            }
        }),
        AuthConfigModule,
        StoreModule.forRoot({ router: routerReducer }),
        StoreRouterConnectingModule.forRoot(),
        environment.production
            ? []
            : StoreDevtoolsModule.instrument({
                  maxAge: 40,
                  logOnly: environment.production, // Disable extension logging in production

                  autoPause: true, // Auto-pause when DevTools isn't open
                  trace: true, // Enables tracing for debugging
                  traceLimit: 40,
                  serialize: true // Ensures state serialization,
              }),
        EffectsModule.forRoot([])
    ],
    providers: [
        { provide: API_BASE_URL, useFactory: () => '.' },
        { provide: LOCALE_ID, useFactory: getLocale },
        { provide: APP_ID, useValue: 'moj-vh' },
        { provide: ErrorHandler, useClass: GlobalErrorHandler },
        VHGlobalEffectsErrorHandler,
        {
            provide: EFFECTS_ERROR_HANDLER,
            useFactory: (errorHandler: VHGlobalEffectsErrorHandler) => errorHandler.handle,
            deps: [VHGlobalEffectsErrorHandler]
        },
        { provide: Navigator, useValue: window.navigator },
        { provide: Document, useValue: window.document },
        {
            provide: APP_INITIALIZER,
            useFactory: loadDefaultPexipClient,
            deps: [SupplierClientService],
            multi: true
        },
        ConfigService,
        DynatraceService,
        Title,
        PageTrackerService,
        ParticipantStatusUpdateService
    ],
    bootstrap: [AppComponent]
})
export class AppModule {
    constructor() {
        registerLocaleData(localeCy, 'cy');
    }
}
