import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { APP_INITIALIZER, NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrowserModule, Title } from '@angular/platform-browser';
import { AdalGuard, AdalInterceptor, AdalService } from 'adal-angular4';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HomeComponent } from './home/home.component';
import { OnTheDayModule } from './on-the-day/on-the-day.module';
import { AuthGuard } from './security/auth.guard';
import { SecurityModule } from './security/security.module';
import { SendVideoEventsComponent } from './send-video-events/send-video-events.component';
import { ConfigService } from './services/api/config.service';
import { VhOfficerModule } from './vh-officer/vh-officer.module';
import { API_BASE_URL } from './services/clients/api-client';
import { SharedModule } from './shared/shared.module';
import { WaitingSpaceModule } from './waiting-space/waiting-space.module';
import { LOG_ADAPTER, LoggerService } from './services/logging/logger.service';
import { ConsoleLogger } from './services/logging/loggers/console-logger';
import { AppInsightsLoggerService } from './services/logging/loggers/app-insights-logger.service';
import { Logger } from './services/logging/logger-base';
import { ScrollTriggerDirective } from './directives/scroll-trigger.directive';
import { WindowScrolling } from './directives/window-scrolling';

export function getSettings(configService: ConfigService) {
  return () => configService.loadConfig();
}

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    SendVideoEventsComponent,
    ScrollTriggerDirective
  ],
  imports: [
    BrowserModule.withServerTransition({ appId: 'ng-cli-universal' }),
    HttpClientModule,
    FormsModule,
    SharedModule,
    SecurityModule,
    WaitingSpaceModule,
    OnTheDayModule,
    AppRoutingModule
  ],
  providers: [
    { provide: APP_INITIALIZER, useFactory: getSettings, deps: [ConfigService], multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: AdalInterceptor, multi: true },
    { provide: Logger, useClass: LoggerService },
    { provide: LOG_ADAPTER, useClass: ConsoleLogger, multi: true },
    { provide: LOG_ADAPTER, useClass: AppInsightsLoggerService, multi: true },
    { provide: API_BASE_URL, useFactory: () => '.' },
    AdalService,
    AdalGuard,
    ConfigService,
    AuthGuard,
    Title,
    WindowScrolling
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
