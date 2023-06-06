import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, ResolveEnd, Router, RouterEvent } from '@angular/router';
import { ApplicationInsights, ITelemetryItem, SeverityLevel } from '@microsoft/applicationinsights-web';
import { combineLatest } from 'rxjs';
import { SecurityServiceProvider } from 'src/app/security/authentication/security-provider.service';
import { ISecurityService } from 'src/app/security/authentication/security-service.interface';
import { ConfigService } from '../../api/config.service';
import { LogAdapter } from '../log-adapter';
import { ClientSettingsResponse, Role } from '../../clients/api-client';
import { filter, map } from 'rxjs/operators';
import { ProfileService } from '../../api/profile.service';

@Injectable({
    providedIn: 'root'
})
export class AppInsightsLoggerService implements LogAdapter {
    errorInfo: any;
    appInsights: ApplicationInsights;
    isVHO: boolean;
    userData;
    currentIdp: string;

    private securityService: ISecurityService;

    constructor(
        securityServiceProviderService: SecurityServiceProvider,
        configService: ConfigService,
        private router: Router,
        private profileService: ProfileService
    ) {
        this.router = router;

        combineLatest([
            configService.getClientSettings(),
            securityServiceProviderService.currentSecurityService$,
            securityServiceProviderService.currentIdp$
        ]).subscribe(([configSettings, securityService, idp]) => {
            this.currentIdp = idp;
            this.securityService = securityService;
            this.setupAppInsights(configSettings, configService, this.securityService).subscribe(() => {
                this.checkIfVho();
                this.trackNavigation();
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
        if (!this.appInsights) {
            return;
        }
        this.updatePropertiesIfVho(properties);
        this.appInsights.trackTrace({ message, severityLevel: SeverityLevel.Information }, properties);
    }

    warn(message: string, properties: any = null): void {
        if (!this.appInsights) {
            return;
        }
        this.updatePropertiesIfVho(properties);
        this.appInsights.trackTrace({ message, severityLevel: SeverityLevel.Warning }, properties);
    }

    trackEvent(eventName: string, properties: any) {
        if (!this.appInsights) {
            return;
        }
        this.updatePropertiesIfVho(properties);
        this.appInsights.trackEvent({ name: eventName }, properties);
    }

    trackException(message: string, err: Error, properties: any) {
        if (!this.appInsights) {
            return;
        }
        properties = properties || {};
        properties.message = message;
        this.updatePropertiesIfVho(properties);

        this.errorInfo = err;
        properties.errorInformation = this.errorInfo
            ? `${this.errorInfo.error} : ${this.errorInfo.status}
       : ${this.errorInfo.statusText} : ${this.errorInfo.url} : ${this.errorInfo.message}`
            : '';

        this.appInsights.trackTrace({ message, severityLevel: SeverityLevel.Error }, properties);
        this.appInsights.trackException({
            exception: err,
            properties: properties
        });
    }

    updateUserId(userId: string) {
        this.appInsights.context.user.id = userId;
    }

    private setupAppInsights(configSettings: ClientSettingsResponse, configService: ConfigService, securityService: ISecurityService) {
        return securityService?.getUserData(this.currentIdp).pipe(
            map(ud => {
                this.appInsights = new ApplicationInsights({
                    config: {
                        instrumentationKey: configSettings.app_insights_instrumentation_key,
                        isCookieUseDisabled: true
                    }
                });
                this.appInsights.loadAppInsights();
                this.appInsights.addTelemetryInitializer((envelope: ITelemetryItem) => {
                    envelope.tags['ai.cloud.role'] = 'vh-video-web';
                    envelope.tags['ai.user.id'] = ud.preferred_username.toLowerCase();
                });
            })
        );
    }

    private checkIfVho() {
        this.securityService
            .isAuthenticated(this.currentIdp)
            .pipe(filter(Boolean))
            .subscribe(() => {
                this.profileService.getUserProfile().then(profile => {
                    this.isVHO = profile.roles?.includes(Role.VideoHearingsOfficer);
                });
            });
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
        if (this.appInsights) {
            this.appInsights.trackPageView({ name: pageName, uri: url });
        }
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
        if (properties && properties instanceof Object && this.isVHO) {
            properties.isVho = this.isVHO;
        }
    }
}
