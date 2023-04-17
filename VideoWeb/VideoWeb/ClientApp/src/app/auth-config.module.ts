import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { AuthInterceptor, AuthModule, StsConfigHttpLoader, StsConfigLoader } from 'angular-auth-oidc-client';
import { RefreshTokenParameterInterceptor } from './security/refresh-token-parameter.interceptor';
import { QuickLinksInterceptor } from './security/quick-links.interceptor';
import { AuthGuard } from './security/auth.guard';
import { SharedModule } from './shared/shared.module';
import { SecurityConfigSetupService } from './security/security-config-setup.service';

export const configLoaderFactory = (configService: SecurityConfigSetupService) => {
    const config$ = configService.setupConfig();
    return new StsConfigHttpLoader(config$);
};

@NgModule({
    imports: [
        SharedModule,
        AuthModule.forRoot({
            loader: {
                provide: StsConfigLoader,
                useFactory: configLoaderFactory,
                deps: [SecurityConfigSetupService]
            }
        })
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
