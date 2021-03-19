import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { APP_INITIALIZER, NgModule } from '@angular/core';
import { AuthInterceptor, AuthModule, LogLevel, OidcConfigService, OidcSecurityService } from 'angular-auth-oidc-client';
import { ConfigService } from './services/api/config.service';

export function loadConfig(configService: ConfigService, oidcConfigService: OidcConfigService) {
    return () => {
        const clientSettings = configService.getClientSettings();
        console.log('****Client Info****');
        console.error(clientSettings);
        return oidcConfigService.withConfig({
            stsServer: `https://login.microsoftonline.com/${clientSettings.tenant_id}/v2.0`,
            // authWellknownEndpoint: `https://login.microsoftonline.com/${clientSettings.tenant_id}`,
            redirectUrl: clientSettings.redirect_uri,
            clientId: clientSettings.client_id,
            scope: 'openid profile',
            responseType: 'code',
            silentRenew: true,
            maxIdTokenIatOffsetAllowedInSeconds: 600,
            issValidationOff: true,
            autoUserinfo: false,
            // silentRenewUrl: window.location.origin + '/silent-renew.html',
            useRefreshToken: true,
            logLevel: LogLevel.Debug,
            secureRoutes: ['https://localhost/', 'hearings.reform.hmcts.net/']
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
        { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true }
    ],
    exports: [AuthModule]
})
export class AuthConfigModule {}
