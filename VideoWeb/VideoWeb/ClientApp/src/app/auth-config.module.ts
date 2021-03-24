import { HttpClientModule, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest, HTTP_INTERCEPTORS } from '@angular/common/http';
import { APP_INITIALIZER, Injectable, NgModule } from '@angular/core';
import { AuthInterceptor, AuthModule, LogLevel, OidcConfigService, OidcSecurityService } from 'angular-auth-oidc-client';
import { Observable } from 'rxjs';
import { ConfigService } from './services/api/config.service';

@Injectable()
export class RefreshTokenParameterIntercepter implements HttpInterceptor {
  constructor(private oidcSecurityService: OidcSecurityService) {    
  }
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (req.method == 'POST' &&
        req.url.endsWith('/oauth2/v2.0/token') &&
        this.oidcSecurityService.configuration.configuration.scope &&
        req.body) {
      let body = req.body as string;
      body += `&scope=${encodeURI(this.oidcSecurityService.configuration.configuration.scope)}`
      req = req.clone({
        body: body
      });
    }

    return next.handle(req);
  }
}

export function loadConfig(configService: ConfigService, oidcConfigService: OidcConfigService) : Function
{
    return () => {
        configService.getClientSettingsObservable().subscribe(clientSettings => {
          // https://github.com/damienbod/angular-auth-oidc-client/blob/8b66484755ad815948d5bc0711e8d9c69ac6661f/docs/configuration.md
          oidcConfigService.withConfig({
            stsServer: `https://login.microsoftonline.com/${clientSettings.tenant_id}/v2.0`,
            redirectUrl: clientSettings.redirect_uri,
            clientId: clientSettings.client_id,
            scope: 'openid profile api://3edd22df-cee5-4109-8e96-703e280b25f6/feapi',
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
  }
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