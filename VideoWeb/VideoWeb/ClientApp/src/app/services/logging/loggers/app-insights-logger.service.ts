import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, ResolveEnd, Router } from '@angular/router';
import { ApplicationInsights, ITelemetryItem, SeverityLevel } from '@microsoft/applicationinsights-web';
import { SecurityServiceProvider } from 'src/app/security/authentication/security-provider.service';
import { ISecurityService } from 'src/app/security/authentication/security-service.interface';
import { ConfigService } from '../../api/config.service';
import { LogAdapter } from '../log-adapter';
import { ClientSettingsResponse, Role } from '../../clients/api-client';
import { filter, switchMap } from 'rxjs/operators';
import { ProfileService } from '../../api/profile.service';
import { combineLatest, of } from 'rxjs';
import { IdpProviders } from 'src/app/security/idp-providers';

@Injectable({
    providedIn: 'root'
})
export class AppInsightsLoggerService implements LogAdapter {
    errorInfo: any;
    appInsights: ApplicationInsights;
    isVHO: boolean;
    userData;
    currentIdp: IdpProviders;
    private config: ClientSettingsResponse;

    private securityService: ISecurityService;
    private idAddedToLog: boolean;

    constructor(
        securityServiceProviderService: SecurityServiceProvider,
        configService: ConfigService,
        private router: Router,
        private profileService: ProfileService
    ) {
        this.router = router;

        combineLatest([
            securityServiceProviderService.currentSecurityService$,
            securityServiceProviderService.currentIdp$,
            configService.getClientSettings()
        ]).subscribe(([securityService, idp, config]) => {
            this.config = config;
            this.currentIdp = idp;
            this.securityService = securityService;

            this.setupAppInsights().subscribe(() => {
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

    addUserIdToLogger(userId: string) {
        if (userId && !this.idAddedToLog) {
            const loweredUserId = userId.toLowerCase();
            this.appInsights.addTelemetryInitializer((envelope: ITelemetryItem) => {
                envelope.tags['ai.user.id'] = loweredUserId;
            });
            this.appInsights.setAuthenticatedUserContext(loweredUserId, loweredUserId, true);
            this.idAddedToLog = true;
        }
    }

    private setupAppInsights() {
        return this.securityService.getUserData(this.currentIdp).pipe(
            switchMap(userData => {
                this.userData = userData;
                this.appInsights = new ApplicationInsights({
                    config: {
                        connectionString: this.config.app_insights_connection_string,
                        isCookieUseDisabled: true
                    }
                });
                let userId: string = null;
                if (userData?.preferred_username) {
                    userId = userData?.preferred_username.toLowerCase();
                }

                if (this.currentIdp === IdpProviders.quickLink && userData?.preferred_username) {
                    const participantId = userData.preferred_username.split('@')[0];
                    userId = `${userData.unique_name.toLowerCase()}_${participantId}`;
                }
                this.appInsights.loadAppInsights();
                this.appInsights.addTelemetryInitializer((envelope: ITelemetryItem) => {
                    const remoteDepedencyType = 'RemoteDependencyData';
                    if (envelope.baseType === remoteDepedencyType && (envelope.baseData.name as string)) {
                        const name = envelope.baseData.name as string;
                        if (name.startsWith('HEAD /assets/images/favicons/favicon.ico?')) {
                            // ignore favicon requests used to poll for availability
                            return false;
                        }
                    }
                    envelope.tags['ai.cloud.role'] = 'vh-video-web';
                });

                this.addUserIdToLogger(userId);
                return of(null);
            })
        );
    }

    private checkIfVho() {
        this.securityService
            .isAuthenticated(this.currentIdp)
            .pipe(filter(Boolean))
            .subscribe(() => {
                this.profileService.getUserProfile().then(profile => {
                    this.isVHO = profile.roles.includes(Role.VideoHearingsOfficer);
                });
            });
    }

    private trackNavigation() {
        this.router.events.pipe(filter(event => event instanceof ResolveEnd)).subscribe((event: ResolveEnd) => this.logPageResolved(event));
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
