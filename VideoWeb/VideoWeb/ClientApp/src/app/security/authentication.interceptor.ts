import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthInterceptor, LoggerService as OidcLoggerService } from 'angular-auth-oidc-client';
import { ConfigurationProvider } from 'angular-auth-oidc-client/lib/config/config.provider';
import { AuthStateService } from 'angular-auth-oidc-client/lib/authState/auth-state.service';
import { SecurityServiceProviderService } from './authentication/security-service-provider.service';
import { SecurityConfigSetupService } from './security-config-setup.service';
import { IdpProviders } from './idp-providers';
import { Logger } from '../services/logging/logger-base';

@Injectable()
export class AuthenticationInterceptor extends AuthInterceptor {
    private loggerPrefix = '[AuthenticationInterceptor] -';
    private currentIdp: IdpProviders;

    constructor(
        private securityConfigSetupService: SecurityConfigSetupService,
        private securityServiceProviderService: SecurityServiceProviderService,
        authStateService: AuthStateService,
        configurationProvider: ConfigurationProvider,
        private vhLoggerService: Logger,
        oidcLoggerService: OidcLoggerService
    ) {
        super(authStateService, configurationProvider, oidcLoggerService);

        this.securityConfigSetupService.currentIdp$.subscribe(newIdp => (this.currentIdp = newIdp));
    }

    intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
        if (this.currentIdp) {
            switch (this.currentIdp) {
                case IdpProviders.magicLink:
                    this.vhLoggerService.debug(`${this.loggerPrefix} IDP is ${this.currentIdp}. Using Magic Links intercepter.`);
                    this.attachMagicLinkUsersToken(request);
                    break;

                case IdpProviders.ejud:
                case IdpProviders.vhaad:
                    this.vhLoggerService.debug(`${this.loggerPrefix} IDP is ${this.currentIdp}. Using OIDC intercepter.`);
                    return super.intercept(request, next);
            }
        } else {
            this.vhLoggerService.warn(`${this.loggerPrefix} Current IDP is not defined. Cannot intercept request.`);
        }

        return next.handle(request);
    }

    private attachMagicLinkUsersToken(request: HttpRequest<unknown>) {
        request.headers.append('bearer-token', this.securityServiceProviderService.getSecurityService().getToken());
    }
}
