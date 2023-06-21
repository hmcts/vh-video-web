import { Injectable } from '@angular/core';
import { LogLevel, OpenIdConfiguration } from 'angular-auth-oidc-client';
import { Observable, ReplaySubject } from 'rxjs';
import { first, map } from 'rxjs/operators';
import { ConfigService } from '../services/api/config.service';
import { IdpSettingsResponse } from '../services/clients/api-client';
import { IdpProviders } from './idp-providers';
import { environment } from 'src/environments/environment';

@Injectable()
export class SecurityConfigSetupService {
    config = {
        ejud: {} as OpenIdConfiguration,
        vhaad: {} as OpenIdConfiguration,
        dom1: {} as OpenIdConfiguration,
        quickLink: {}
    };

    private idpProvidersSessionStorageKey = 'IdpProviders';
    private defaultProvider = IdpProviders.vhaad;

    private currentIdpSubject = new ReplaySubject<IdpProviders>(1);

    constructor(private configService: ConfigService) {}

    get currentIdp$(): Observable<IdpProviders> {
        return this.currentIdpSubject.asObservable();
    }

    setupConfig(): Observable<OpenIdConfiguration[]> {
        return this.configService.getClientSettings().pipe(
            first(),
            map(clientSettings => {
                this.config[IdpProviders.vhaad] = this.initOidcConfig(clientSettings.vh_idp_settings);
                this.config[IdpProviders.ejud] = this.initOidcConfig(clientSettings.e_jud_idp_settings);
                this.config[IdpProviders.dom1] = this.initOidcConfig(clientSettings.dom1_idp_settings);
                return [this.config[IdpProviders.ejud], this.config[IdpProviders.vhaad], this.config[IdpProviders.dom1]];
            })
        );
    }

    initOidcConfig(idpSettings: IdpSettingsResponse): OpenIdConfiguration {
        const resource = idpSettings.resource_id ? idpSettings.resource_id : `api://${idpSettings.client_id}`;
        return {
            configId: idpSettings.config_id,
            authority: `https://login.microsoftonline.com/${idpSettings.tenant_id}/v2.0`,
            redirectUrl: idpSettings.redirect_uri,
            clientId: idpSettings.client_id,
            scope: `openid profile offline_access ${resource}/feapi`,
            responseType: 'code',
            maxIdTokenIatOffsetAllowedInSeconds: 600,
            autoUserInfo: false,
            logLevel: environment.production ? LogLevel.Warn : LogLevel.Debug,
            secureRoutes: ['.'],
            ignoreNonceAfterRefresh: true,
            postLogoutRedirectUri: idpSettings.post_logout_redirect_uri,
            tokenRefreshInSeconds: 5,
            silentRenew: true,
            useRefreshToken: true,
            historyCleanupOff: false
        } as OpenIdConfiguration;
    }

    restoreConfig() {
        const provider = this.getIdp();
        this.currentIdpSubject.next(provider);
    }

    setIdp(provider: IdpProviders) {
        window.sessionStorage.setItem(this.idpProvidersSessionStorageKey, provider);
        this.currentIdpSubject.next(provider);
    }

    getIdp(): IdpProviders {
        return (window.sessionStorage.getItem(this.idpProvidersSessionStorageKey) as IdpProviders) ?? this.defaultProvider;
    }
}
