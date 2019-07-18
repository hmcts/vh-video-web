
import { AppInsights } from 'applicationinsights-js';
import { Injectable } from '@angular/core';
import { ConfigService } from '../../api/config.service';
import { LogAdapter } from '../log-adapter';
import { Router, ResolveEnd, ActivatedRouteSnapshot } from '@angular/router';
import { filter } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AppInsightsLoggerService implements LogAdapter {

  errorInfo: any;
  router: Router;

  constructor(configService: ConfigService, router: Router) {
    this.router = router;
    this.setupAppInsights(configService);
    this.trackNavigation();
  }

  private setupAppInsights(configService: ConfigService) {
    const config = configService.getClientSettings();
    const appInsightsConfig: Microsoft.ApplicationInsights.IConfig = {
      instrumentationKey: config.app_insights_instrumentation_key
    };

    if (!AppInsights.config) {
      AppInsights.downloadAndSetup(appInsightsConfig);
    }

    // When it's been initialised, set the role so we know which application is logging
    AppInsights.queue.push(() => {
      AppInsights.context.addTelemetryInitializer((envelope) => {
        envelope.tags['ai.cloud.role'] = 'vh-video-web';
      });
    });
  }

  debug(message: string): void {
    AppInsights.trackTrace(message, null, AI.SeverityLevel.Verbose);
  }

  info(message: string): void {
    AppInsights.trackTrace(message, null, AI.SeverityLevel.Information);
    console.info(`${this.router.url}`);
  }

  warn(message: string): void {
    AppInsights.trackTrace(message, null, AI.SeverityLevel.Warning);
  }

  trackEvent(eventName: string, properties: any) {
    AppInsights.trackEvent(eventName, properties);
  }

  trackException(message: string, err: Error, properties: any) {
    properties = properties || {};
    properties.message = message;

    this.errorInfo = err;
    properties.errorInformation =
      this.errorInfo ? `${this.errorInfo.error} : ${this.errorInfo.status}
       : ${this.errorInfo.statusText} : ${this.errorInfo.url} : ${this.errorInfo.message}` : ``;

    AppInsights.trackException(err, null, properties);
  }

  private trackNavigation() {
    this.router.events.pipe(
      filter((event: Event) => event instanceof ResolveEnd)
    ).subscribe((event: ResolveEnd) => this.logPageResolved(event));
  }

  private logPageResolved(event: ResolveEnd): void {
    const activatedComponent = this.getActivatedComponent(event.state.root);
    if (activatedComponent) {
      this.trackPage(`${activatedComponent.name} ${this.getRouteTemplate(event.state.root)}`, event.urlAfterRedirects);
    }
  }

  private trackPage(pageName: string, url: string) {
    AppInsights.trackPageView(pageName, url);
  }

  private getActivatedComponent(snapshot: ActivatedRouteSnapshot): any {
    if (snapshot.firstChild) {
      return this.getActivatedComponent(snapshot.firstChild);
    }

    return snapshot.component;
  }

  private getRouteTemplate(snapshot: ActivatedRouteSnapshot): string {
    const path = snapshot.routeConfig ? snapshot.routeConfig.path : '';

    if (snapshot.firstChild) {
      return path + '/' + this.getRouteTemplate(snapshot.firstChild);
    }

    return path;
  }
}
