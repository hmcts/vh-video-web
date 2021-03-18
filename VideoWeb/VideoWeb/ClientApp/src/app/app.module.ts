import { HttpClient, HttpClientModule, HttpXhrBackend, HTTP_INTERCEPTORS } from '@angular/common/http';
import { APP_INITIALIZER, ErrorHandler, LOCALE_ID, NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrowserModule, Title } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { Router } from '@angular/router';
import { AdalGuard, AdalInterceptor, AdalService } from 'adal-angular4';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HomeComponent } from './home/home.component';
import { OnTheDayModule } from './on-the-day/on-the-day.module';
import { AuthGuard } from './security/auth.guard';
import { SecurityModule } from './security/security.module';
import { ConfigService } from './services/api/config.service';
import { API_BASE_URL } from './services/clients/api-client';
import { Logger } from './services/logging/logger-base';
import { LoggerService, LOG_ADAPTER } from './services/logging/logger.service';
import { AppInsightsLoggerService } from './services/logging/loggers/app-insights-logger.service';
import { ConsoleLogger } from './services/logging/loggers/console-logger';
import { PageTrackerService } from './services/page-tracker.service';
import { ParticipantStatusUpdateService } from './services/participant-status-update.service';
import { GlobalErrorHandler } from './shared/providers/global-error-handler';
import { SharedModule } from './shared/shared.module';
import { WaitingSpaceModule } from './waiting-space/waiting-space.module';
import { ConfigSettingsResolveService } from 'src/app/services/config-settings-resolve.service';
import { TranslateModule, TranslateLoader, MissingTranslationHandler } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { DisplayMissingTranslationHandler } from './shared/display-missing-translation-handler';
import { registerLocaleData } from '@angular/common';
import localeCy from '@angular/common/locales/cy';

export function createTranslateLoader() {
    // We cant inject a httpClient because it has a race condition with adal
    // resulting in a null context when trying to load the translatons
    const httpClient = new HttpClient(new HttpXhrBackend({ build: () => new XMLHttpRequest() }));
    return new TranslateHttpLoader(httpClient, './assets/i18n/', '.json');
}

export function getSettings(configService: ConfigService) {
    return () => configService.loadConfig();
}

export function getLocale() {
    const language = localStorage.getItem('language') ?? 'en';
    return language === 'tl' ? 'cy' : language;
}

@NgModule({
    declarations: [AppComponent, HomeComponent],
    imports: [
        BrowserModule.withServerTransition({ appId: 'ng-cli-universal' }),
        HttpClientModule,
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
        })
    ],
    providers: [
        { provide: APP_INITIALIZER, useFactory: getSettings, deps: [ConfigService], multi: true },
        { provide: Logger, useClass: LoggerService },
        { provide: LOG_ADAPTER, useClass: ConsoleLogger, multi: true },
        { provide: LOG_ADAPTER, useClass: AppInsightsLoggerService, multi: true, deps: [ConfigService, Router, AdalService] },
        { provide: API_BASE_URL, useFactory: () => '.' },
        { provide: LOCALE_ID, useFactory: getLocale },
        AdalService,
        AdalGuard,
        { provide: HTTP_INTERCEPTORS, useClass: AdalInterceptor, multi: true },
        { provide: ErrorHandler, useClass: GlobalErrorHandler },
        ConfigService,
        AuthGuard,
        Title,
        PageTrackerService,
        ParticipantStatusUpdateService,
        ConfigSettingsResolveService
    ],
    bootstrap: [AppComponent]
})
export class AppModule {
    constructor() {
        registerLocaleData(localeCy, 'cy');
    }
}
