import { APP_INITIALIZER, NgModule } from '@angular/core';
import { AuthModule, LogLevel, OidcConfigService, OidcSecurityService } from 'angular-auth-oidc-client';

export function loadConfig(oidcConfigService: OidcConfigService) {
    return () =>
        oidcConfigService.withConfig({
            stsServer: 'https://login.microsoftonline.com/fb6e0e22-0da3-4c35-972a-9d61eb256508/v2.0',
            // authWellknownEndpoint: 'https://login.microsoftonline.com/fb6e0e22-0da3-4c35-972a-9d61eb256508',
            redirectUrl: 'https://localhost:5800/home',
            clientId: '7a00ed39-469b-4cc6-a1aa-2d7b32c0eed2',
            scope: 'openid',
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
