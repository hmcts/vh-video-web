import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { APP_INITIALIZER, NgModule } from '@angular/core';
import { AuthInterceptor, AuthModule, OidcConfigService, OidcSecurityService } from 'angular-auth-oidc-client';
import { OidcConfigSetupService } from './security/oidc-config-setup.service';
import { RefreshTokenParameterInterceptor } from './security/refresh-token-parameter.interceptor';
import { ConfigService } from './services/api/config.service';

export function loadConfig(oidcConfigSetupService: OidcConfigSetupService): Function {
    return () => {
        oidcConfigSetupService.restoreConfig();
    };
}

@NgModule({
    imports: [AuthModule.forRoot(), HttpClientModule],
    providers: [
        OidcSecurityService,
        OidcConfigService,
        OidcConfigSetupService,
        ConfigService,
        {
            provide: APP_INITIALIZER,
            useFactory: loadConfig,
            deps: [OidcConfigSetupService],
            multi: true
        },
        { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
        { provide: HTTP_INTERCEPTORS, useClass: RefreshTokenParameterInterceptor, multi: true }
    ],
    exports: [AuthModule]
})
export class AuthConfigModule {}
