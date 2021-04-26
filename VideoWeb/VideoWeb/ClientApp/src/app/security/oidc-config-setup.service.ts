import { Injectable } from '@angular/core';
import { LogLevel, OidcConfigService, OpenIdConfiguration } from 'angular-auth-oidc-client';
import { BehaviorSubject } from 'rxjs';
import { filter } from 'rxjs/operators';
import { ConfigService } from '../services/api/config.service';
import { IdpSettingsResponse } from '../services/clients/api-client';

@Injectable()
export class OidcConfigSetupService {
    config = {
        ejud: {} as OpenIdConfiguration,
        vhaad: {} as OpenIdConfiguration
    };
    private defaultProvider = 'vhaad';
    private configSetup$ = new BehaviorSubject(false);

    constructor(private oidcConfigService: OidcConfigService, configService: ConfigService) {
        configService.getClientSettings().subscribe(clientSettings => {
            this.config.ejud = this.initOidcConfig(clientSettings.e_jud_idp_settings);
            this.config.vhaad = this.initOidcConfig(clientSettings.vh_idp_settings);

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
        });
    }

    setIdp(provider: string) {
        window.sessionStorage.setItem('OidcProvider', provider);
        this.configSetup$.pipe(filter(Boolean)).subscribe(() => {
            this.oidcConfigService.withConfig(this.config[provider]);
        });
    }

    getIdp() {
        return window.sessionStorage.getItem('OidcProvider') ?? this.defaultProvider;
    }
}
