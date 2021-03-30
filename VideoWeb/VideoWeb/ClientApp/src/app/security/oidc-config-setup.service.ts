import { Injectable } from '@angular/core';
import { LogLevel, OidcConfigService, OpenIdConfiguration } from 'angular-auth-oidc-client';
import { BehaviorSubject } from 'rxjs';
import { filter } from 'rxjs/operators';
import { ConfigService } from '../services/api/config.service';

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
            this.config.ejud = {
                stsServer: 'https://login.microsoftonline.com/0b90379d-18de-426a-ae94-7f62441231e0/v2.0',
                redirectUrl: clientSettings.redirect_uri,
                clientId: 'a6596b93-7bd6-4363-81a4-3e6d9aa2df2b',
                scope: 'openid profile offline_access api://a6596b93-7bd6-4363-81a4-3e6d9aa2df2b/feapi',
                responseType: 'code',
                maxIdTokenIatOffsetAllowedInSeconds: 600,
                autoUserinfo: false,
                logLevel: LogLevel.Debug,
                secureRoutes: ['.'],
                ignoreNonceAfterRefresh: true,

                tokenRefreshInSeconds: 5,
                silentRenew: true,
                useRefreshToken: true
            };
            this.config.vhaad = {
                stsServer: `https://login.microsoftonline.com/${clientSettings.tenant_id}/v2.0`,
                redirectUrl: clientSettings.redirect_uri,
                clientId: clientSettings.client_id,
                scope: `openid profile offline_access api://${clientSettings.client_id}/feapi`,
                responseType: 'code',
                maxIdTokenIatOffsetAllowedInSeconds: 600,
                autoUserinfo: false,
                logLevel: LogLevel.Debug,
                secureRoutes: ['.'],
                ignoreNonceAfterRefresh: true,

                tokenRefreshInSeconds: 5,
                silentRenew: true,
                useRefreshToken: true
            };
            this.configSetup$.next(true);
        });
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
