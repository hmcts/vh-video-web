import { HttpClientModule, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest, HTTP_INTERCEPTORS } from '@angular/common/http';
import { APP_INITIALIZER, Injectable, NgModule } from '@angular/core';
import { AuthModule, LoggerService, LogLevel, OidcConfigService, OidcSecurityService } from 'angular-auth-oidc-client';
import { Observable } from 'rxjs';
import { ConfigService } from './services/api/config.service';

@Injectable()
export class AuthInterceptor2 implements HttpInterceptor {
  constructor(
    private oidcSecurityService: OidcSecurityService,
    private loggerService: LoggerService
  ) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const token = this.oidcSecurityService.getIdToken();

    if (!token) {
      this.loggerService.logDebug(`Wanted to add token to ${req.url} but found no token: '${token}'`);
      return next.handle(req);
    }

    req = req.clone({
      headers: req.headers.set('Authorization', 'Bearer ' + token),
    });

    return next.handle(req);
  }
}

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
            autoUserinfo: true,
            useRefreshToken: true,
            logLevel: LogLevel.Debug,
            secureRoutes: ['.']
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
        //{ provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
        { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor2, multi: true }
    ],
    exports: [AuthModule]
})
export class AuthConfigModule {}