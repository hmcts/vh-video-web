import { Injectable } from '@angular/core';
import { LogLevel, OidcConfigService, OpenIdConfiguration } from 'angular-auth-oidc-client';
import { BehaviorSubject, Observable, ReplaySubject } from 'rxjs';
import { filter } from 'rxjs/operators';
import { ConfigService } from '../services/api/config.service';
import { IdpSettingsResponse } from '../services/clients/api-client';
import { IdpProviders } from './idp-providers';

@Injectable()
export class SecurityConfigSetupService {
    config = {
        ejud: {} as OpenIdConfiguration,
        vhaad: {} as OpenIdConfiguration,
        magicLink: {}
    };

    private IdpProvidersSessionStorageKey = 'IdpProviders';
    private defaultProvider = IdpProviders.vhaad;
    private configSetup$ = new BehaviorSubject(false);
    private currentIdpSubject = new BehaviorSubject<IdpProviders>(IdpProviders.vhaad);

    constructor(private oidcConfigService: OidcConfigService, configService: ConfigService) {
        configService.getClientSettings().subscribe(clientSettings => {
            this.config[IdpProviders.ejud] = this.initOidcConfig(clientSettings.e_jud_idp_settings);
            this.config[IdpProviders.vhaad] = this.initOidcConfig(clientSettings.vh_idp_settings);

            this.configSetup$.next(true);
        });
    }

    initOidcConfig(idpSettings: IdpSettingsResponse): OpenIdConfiguration {
        return {
            stsServer: `https://login.microsoftonline.com/${idpSettings.tenant_id}/v2.0`,
            redirectUrl: idpSettings.redirect_uri,
            clientId: idpSettings.client_id,
            scope: `openid profile offline_access api://${idpSettings.client_id}/feapi`,
            responseType: 'code',
            maxIdTokenIatOffsetAllowedInSeconds: 600,
            autoUserinfo: false,
            logLevel: LogLevel.Debug,
            secureRoutes: ['.'],
            ignoreNonceAfterRefresh: true,
            postLogoutRedirectUri: idpSettings.post_logout_redirect_uri,
            tokenRefreshInSeconds: 5,
            silentRenew: true,
            useRefreshToken: true
        };
    }

    restoreConfig() {
        const provider = this.getIdp();
        this.configSetup$.pipe(filter(Boolean)).subscribe(() => {
            this.oidcConfigService.withConfig(this.config[provider]);
            this.currentIdpSubject.next(provider);
        });
    }

    setIdp(provider: IdpProviders) {
        window.sessionStorage.setItem(this.IdpProvidersSessionStorageKey, provider);
        this.configSetup$.pipe(filter(Boolean)).subscribe(() => {
            if (provider !== IdpProviders.magicLink) {
                this.oidcConfigService.withConfig(this.config[provider]);
            }
            this.currentIdpSubject.next(provider);
        });
    }

    getIdp(): IdpProviders {
        return (
            (window.sessionStorage.getItem(this.IdpProvidersSessionStorageKey) as IdpProviders) ?? (this.defaultProvider as IdpProviders)
        );
    }

    get currentIdp$(): Observable<IdpProviders> {
        return this.currentIdpSubject.asObservable();
    }
}
