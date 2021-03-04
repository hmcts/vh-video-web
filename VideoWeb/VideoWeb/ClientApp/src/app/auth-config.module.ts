import { APP_INITIALIZER, NgModule } from '@angular/core';
import { AuthModule, LogLevel, OidcConfigService, OidcSecurityService } from 'angular-auth-oidc-client';

export function loadConfig(oidcConfigService: OidcConfigService) {
    return () =>
        oidcConfigService.withConfig({
            stsServer: 'https://login.microsoftonline.com/fb6e0e22-0da3-4c35-972a-9d61eb256508/v2.0',
            // authWellknownEndpoint: 'https://login.microsoftonline.com/fb6e0e22-0da3-4c35-972a-9d61eb256508',
            redirectUrl: 'https://localhost:5800/home',
            clientId: '3edd22df-cee5-4109-8e96-703e280b25f6',
            scope: 'openid profile',
            responseType: 'code',
            silentRenew: true,
            maxIdTokenIatOffsetAllowedInSeconds: 600,
            issValidationOff: true,
            autoUserinfo: false,
            // silentRenewUrl: window.location.origin + '/silent-renew.html',
            useRefreshToken: true,
            logLevel: LogLevel.Debug
        });
}

@NgModule({
    imports: [AuthModule.forRoot()],
    providers: [
        OidcSecurityService,
        OidcConfigService,
        {
            provide: APP_INITIALIZER,
            useFactory: loadConfig,
            deps: [OidcConfigService],
            multi: true
        }
    ],
    exports: [AuthModule]
})
export class AuthConfigModule {
}
