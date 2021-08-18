import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { APP_INITIALIZER, NgModule } from '@angular/core';
import { AuthInterceptor, AuthModule } from 'angular-auth-oidc-client';
import { SecurityConfigSetupService } from './security/security-config-setup.service';
import { RefreshTokenParameterInterceptor } from './security/refresh-token-parameter.interceptor';
import { ConfigService } from './services/api/config.service';
import { QuickLinksInterceptor } from './security/quick-links.interceptor';
import { AuthGuard } from './security/auth.guard';

export function setupSecurity(securityConfigService: SecurityConfigSetupService) {
    return () => securityConfigService.setupConfig();
}

export function loadConfig(securityConfigSetupService: SecurityConfigSetupService): Function {
    return () => {
        securityConfigSetupService.restoreConfig();
    };
}

@NgModule({
    imports: [AuthModule.forRoot(), HttpClientModule],
    providers: [
        SecurityConfigSetupService,
        ConfigService,
        { provide: APP_INITIALIZER, useFactory: setupSecurity, deps: [SecurityConfigSetupService], multi: true },
        {
            provide: APP_INITIALIZER,
            useFactory: loadConfig,
            deps: [SecurityConfigSetupService],
            multi: true
        },
        { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
        { provide: HTTP_INTERCEPTORS, useClass: QuickLinksInterceptor, multi: true },
        { provide: HTTP_INTERCEPTORS, useClass: RefreshTokenParameterInterceptor, multi: true },
        AuthGuard
    ],
    exports: [AuthModule]
})
export class AuthConfigModule {}
