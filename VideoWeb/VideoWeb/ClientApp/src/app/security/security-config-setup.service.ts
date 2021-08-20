import { Injectable } from '@angular/core';
import { LogLevel, OidcConfigService, OpenIdConfiguration } from 'angular-auth-oidc-client';
import { BehaviorSubject, Observable } from 'rxjs';
import { filter } from 'rxjs/operators';
import { ConfigService } from '../services/api/config.service';
import { IdpSettingsResponse } from '../services/clients/api-client';
import { IdpProviders } from './idp-providers';

@Injectable()
export class SecurityConfigSetupService {
    config = {
        ejud: {} as OpenIdConfiguration,
        vhaad: {} as OpenIdConfiguration,
        quickLink: {}
    };

    private idpProvidersSessionStorageKey = 'IdpProviders';
    private defaultProvider = IdpProviders.vhaad;
    private _configSetupSubject = new BehaviorSubject(false);
    get configSetup$() {
        return this._configSetupSubject.asObservable();
    }
    private currentIdpSubject = new BehaviorSubject<IdpProviders>(null); // TODO try replay subject?

    constructor(private oidcConfigService: OidcConfigService, private configService: ConfigService) {
        this.currentIdpSubject.next(this.getIdp());
    }

    setupConfig() {
        this.configService.getClientSettings().subscribe(clientSettings => {
            this.config[IdpProviders.ejud] = this.initOidcConfig(clientSettings.e_jud_idp_settings);
            this.config[IdpProviders.vhaad] = this.initOidcConfig(clientSettings.vh_idp_settings);

            this.oidcConfigService.withConfig(this.config[this.defaultProvider]);
            this._configSetupSubject.next(true);
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
        if (provider !== IdpProviders.quickLink) {
            this._configSetupSubject.pipe(filter(Boolean)).subscribe(() => {
                this.oidcConfigService.withConfig(this.config[provider]);
                this.currentIdpSubject.next(provider);
            });
        }
    }

    setIdp(provider: IdpProviders) {
        window.sessionStorage.setItem(this.idpProvidersSessionStorageKey, provider);
        this.currentIdpSubject.next(provider);
        this._configSetupSubject.pipe(filter(Boolean)).subscribe(() => {
            if (provider !== IdpProviders.quickLink) {
                this.oidcConfigService.withConfig(this.config[provider]);
            }
        });
    }

    getIdp(): IdpProviders {
        return (window.sessionStorage.getItem(this.idpProvidersSessionStorageKey) as IdpProviders) ?? this.defaultProvider;
    }

    get currentIdp$(): Observable<IdpProviders> {
        return this.currentIdpSubject.asObservable();
    }
}
