import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, ResolveEnd, Router, RouterEvent } from '@angular/router';
import { ApplicationInsights, ITelemetryItem, SeverityLevel } from '@microsoft/applicationinsights-web';
import { OidcSecurityService } from 'angular-auth-oidc-client';
import { Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { ConfigService } from '../../api/config.service';
import { ProfileService } from '../../api/profile.service';
import { Role } from '../../clients/api-client';
import { LogAdapter } from '../log-adapter';

@Injectable({
    providedIn: 'root'
})
export class AppInsightsLoggerService implements LogAdapter {
    errorInfo: any;
    router: Router;
    appInsights: ApplicationInsights;
    isVHO: boolean;
    userData;

    constructor(
        configService: ConfigService,
        router: Router,
        oidcSecurityService: OidcSecurityService,
        private profileService: ProfileService
    ) {
        this.router = router;
        this.setupAppInsights(configService, oidcSecurityService).subscribe(() => {
            this.checkIfVho(oidcSecurityService);
            this.trackNavigation();
        });
    }

    private setupAppInsights(configService: ConfigService, oidcSecurityService: OidcSecurityService): Observable<void> {
        configService.loadConfig();
        return configService.getClientSettings().pipe(
            map(configSettings => {
                this.appInsights = new ApplicationInsights({
                    config: {
                        instrumentationKey: configSettings.app_insights_instrumentation_key
                    }
                });
                this.appInsights.loadAppInsights();
                oidcSecurityService.userData$.subscribe(ud => {
                    this.appInsights.addTelemetryInitializer((envelope: ITelemetryItem) => {
                        envelope.tags['ai.cloud.role'] = 'vh-video-web';
                        envelope.tags['ai.user.id'] = ud.preferred_username.toLowerCase();
                    });
                });
            })
        );
    }

    private checkIfVho(oidcSecurityService: OidcSecurityService) {
        oidcSecurityService.isAuthenticated$.pipe(filter(Boolean)).subscribe(() => {
            this.profileService.getUserProfile().then(profile => {
                this.isVHO = profile.role === Role.VideoHearingsOfficer;
            });
        });
    }

    debug(message: string, properties: any = null): void {
        if (this.appInsights) {
            this.updatePropertiesIfVho(properties);
            this.appInsights.trackTrace({ message, severityLevel: SeverityLevel.Verbose }, properties);
        }
    }

    info(message: string, properties: any = null): void {
        this.updatePropertiesIfVho(properties);
        this.appInsights.trackTrace({ message, severityLevel: SeverityLevel.Information }, properties);
    }

    warn(message: string, properties: any = null): void {
        this.updatePropertiesIfVho(properties);
        this.appInsights.trackTrace({ message, severityLevel: SeverityLevel.Warning }, properties);
    }

    trackEvent(eventName: string, properties: any) {
        this.updatePropertiesIfVho(properties);
        this.appInsights.trackEvent({ name: eventName }, properties);
    }

    trackException(message: string, err: Error, properties: any) {
        properties = properties || {};
        properties.message = message;
        this.updatePropertiesIfVho(properties);

        this.errorInfo = err;
        properties.errorInformation = this.errorInfo
            ? `${this.errorInfo.error} : ${this.errorInfo.status}
       : ${this.errorInfo.statusText} : ${this.errorInfo.url} : ${this.errorInfo.message}`
            : ``;

        this.appInsights.trackTrace({ message, severityLevel: SeverityLevel.Error }, properties);
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
        this.appInsights.trackPageView({ name: pageName, uri: url });
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

    private updatePropertiesIfVho(properties: any) {
        if (properties && this.isVHO) {
            properties.isVho = this.isVHO;
        }
    }
}
