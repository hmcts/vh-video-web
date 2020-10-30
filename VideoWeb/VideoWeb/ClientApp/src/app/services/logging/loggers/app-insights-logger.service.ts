import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, ResolveEnd, Router, RouterEvent } from '@angular/router';
import { ApplicationInsights, ITelemetryItem, SeverityLevel } from '@microsoft/applicationinsights-web';
import { AdalService } from 'adal-angular4';
import { filter } from 'rxjs/operators';
import { ConfigService } from '../../api/config.service';
import { LogAdapter } from '../log-adapter';

@Injectable({
    providedIn: 'root'
})
export class AppInsightsLoggerService implements LogAdapter {
    errorInfo: any;
    router: Router;
    appInsights: ApplicationInsights;

    constructor(configService: ConfigService, router: Router, adalService: AdalService) {
        this.router = router;
        this.setupAppInsights(configService, adalService).then(() => {
            this.trackNavigation();
        });
    }

    private async setupAppInsights(configService: ConfigService, adalService: AdalService) {
        await configService.loadConfig();
        const config = configService.getClientSettings();
        this.appInsights = new ApplicationInsights({
            config: {
                instrumentationKey: config.app_insights_instrumentation_key
            }
        });
        this.appInsights.loadAppInsights();
        this.appInsights.addTelemetryInitializer((envelope: ITelemetryItem) => {
            envelope.tags['ai.cloud.role'] = 'vh-video-web';
            envelope.tags['ai.user.id'] = adalService.userInfo.userName.toLowerCase();
        });
    }

    debug(message: string, properties: any = null): void {
        this.appInsights.trackTrace({ message, severityLevel: SeverityLevel.Verbose }, properties);
    }

    info(message: string, properties: any = null): void {
        this.appInsights.trackTrace({ message, severityLevel: SeverityLevel.Information }, properties);
    }

    warn(message: string, properties: any = null): void {
        this.appInsights.trackTrace({ message, severityLevel: SeverityLevel.Warning }, properties);
    }

    trackEvent(eventName: string, properties: any) {
        this.appInsights.trackEvent({ name: eventName }, properties);
    }

    trackException(message: string, err: Error, properties: any) {
        properties = properties || {};
        properties.message = message;

        this.errorInfo = err;
        properties.errorInformation = this.errorInfo
            ? `${this.errorInfo.error} : ${this.errorInfo.status}
       : ${this.errorInfo.statusText} : ${this.errorInfo.url} : ${this.errorInfo.message}`
            : ``;
        this.appInsights.trackException({
            error: err,
            properties: properties
        });
    }

    updateUserId(userId: string) {
        this.appInsights.context.user.id = userId;
    }

    private trackNavigation() {
        this.router.events
            .pipe(filter((event: RouterEvent) => event instanceof ResolveEnd))
            .subscribe((event: ResolveEnd) => this.logPageResolved(event));
    }

    private logPageResolved(event: ResolveEnd): void {
        const activatedComponent = this.getActivatedComponent(event.state.root);
        if (activatedComponent) {
            this.trackPage(`${activatedComponent.name} ${this.getRouteTemplate(event.state.root)}`, event.urlAfterRedirects);
        }
    }

    private trackPage(pageName: string, url: string) {
        this.appInsights.trackPageView({ name, uri: url });
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
