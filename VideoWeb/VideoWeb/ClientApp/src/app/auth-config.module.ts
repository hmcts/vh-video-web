import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { AuthInterceptor, AuthModule } from 'angular-auth-oidc-client';
import { RefreshTokenParameterInterceptor } from './security/refresh-token-parameter.interceptor';
import { QuickLinksInterceptor } from './security/quick-links.interceptor';
import { AuthGuard } from './security/auth.guard';
import { SharedModule } from './shared/shared.module';

// export const configLoaderFactory = (configService: ConfigService) => {
//     const config$ = configService.getClientSettings().pipe(
//         first(),
//         map(clientSettings => {
//             const ejud = initOidcConfig(clientSettings.e_jud_idp_settings);
//             const vhaad = initOidcConfig(clientSettings.vh_idp_settings);

//             return [ejud, vhaad];
//         })
//     );
//     return new StsConfigHttpLoader(config$);
// };

// function initOidcConfig(idpSettings: IdpSettingsResponse): OpenIdConfiguration {
//     const resource = idpSettings.resource_id ? idpSettings.resource_id : `api://${idpSettings.client_id}`;
//     return {
//         configId: idpSettings.config_id,
//         authority: `https://login.microsoftonline.com/${idpSettings.tenant_id}/v2.0`,
//         redirectUrl: idpSettings.redirect_uri,
//         clientId: idpSettings.client_id,
//         scope: `openid profile offline_access ${resource}/feapi`,
//         responseType: 'code',
//         maxIdTokenIatOffsetAllowedInSeconds: 600,
//         autoUserInfo: false,
//         logLevel: LogLevel.Debug,
//         secureRoutes: ['.'],
//         ignoreNonceAfterRefresh: true,
//         postLogoutRedirectUri: idpSettings.post_logout_redirect_uri,
//         tokenRefreshInSeconds: 5,
//         silentRenew: true,
//         useRefreshToken: true
//     };
// }

@NgModule({
    imports: [
        SharedModule
        // AuthModule.forRoot({
        //     loader: {
        //         provide: StsConfigLoader,
        //         useFactory: configLoaderFactory,
        //         deps: [ConfigService]
        //     }
        // })
    ],
    providers: [
        { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
        { provide: HTTP_INTERCEPTORS, useClass: QuickLinksInterceptor, multi: true },
        { provide: HTTP_INTERCEPTORS, useClass: RefreshTokenParameterInterceptor, multi: true },
        AuthGuard
    ],
    exports: [AuthModule]
})
export class AuthConfigModule {}
