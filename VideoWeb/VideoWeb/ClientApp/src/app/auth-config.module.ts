import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { APP_INITIALIZER, NgModule } from '@angular/core';
import { AuthInterceptor, AuthModule, OidcConfigService, OidcSecurityService } from 'angular-auth-oidc-client';
import { SecurityConfigSetupService } from './security/security-config-setup.service';
import { RefreshTokenParameterInterceptor } from './security/refresh-token-parameter.interceptor';
import { ConfigService } from './services/api/config.service';
import { AuthenticationInterceptor } from './security/authentication.interceptor';

export function loadConfig(securityConfigSetupService: SecurityConfigSetupService): Function {
    return () => {
        securityConfigSetupService.restoreConfig();
    };
}

@NgModule({
    imports: [AuthModule.forRoot(), HttpClientModule],
    providers: [
        OidcSecurityService,
        OidcConfigService,
        SecurityConfigSetupService,
        ConfigService,
        {
            provide: APP_INITIALIZER,
            useFactory: loadConfig,
            deps: [SecurityConfigSetupService],
            multi: true
        },
        { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
        { provide: HTTP_INTERCEPTORS, useClass: AuthenticationInterceptor, multi: true },
        { provide: HTTP_INTERCEPTORS, useClass: RefreshTokenParameterInterceptor, multi: true }
    ],
    exports: [AuthModule]
})
export class AuthConfigModule {}
