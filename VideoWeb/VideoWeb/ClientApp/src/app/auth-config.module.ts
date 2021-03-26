import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { APP_INITIALIZER, NgModule } from '@angular/core';
import { AuthInterceptor, AuthModule, LogLevel, OidcConfigService, OidcSecurityService } from 'angular-auth-oidc-client';
import { RefreshTokenParameterIntercepter } from './security/refresh-token-parameter.intercepter';
import { ConfigService } from './services/api/config.service';

export function loadConfig(configService: ConfigService, oidcConfigService: OidcConfigService): Function {
    return () => {
        configService.getClientSettings().subscribe(clientSettings => {
            // https://github.com/damienbod/angular-auth-oidc-client/blob/8b66484755ad815948d5bc0711e8d9c69ac6661f/docs/configuration.md
            oidcConfigService.withConfig({
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
            });
        });
    };
}

@NgModule({
    imports: [AuthModule.forRoot(), HttpClientModule],
    providers: [
        OidcSecurityService,
        OidcConfigService,
        ConfigService,
        {
            provide: APP_INITIALIZER,
            useFactory: loadConfig,
            deps: [ConfigService, OidcConfigService],
            multi: true
        },
        { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
        { provide: HTTP_INTERCEPTORS, useClass: RefreshTokenParameterIntercepter, multi: true }
    ],
    exports: [AuthModule]
})
export class AuthConfigModule {}
