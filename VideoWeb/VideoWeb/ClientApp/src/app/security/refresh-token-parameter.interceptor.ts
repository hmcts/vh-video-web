import { HttpInterceptor, HttpHandler, HttpEvent, HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { OidcSecurityService } from 'angular-auth-oidc-client';
import { Observable } from 'rxjs';

@Injectable()
export class RefreshTokenParameterInterceptor implements HttpInterceptor {
    constructor(private oidcSecurityService: OidcSecurityService) {}
    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        if (
            req.method === 'POST' &&
            req.url.endsWith('/oauth2/v2.0/token') &&
            this.oidcSecurityService.configuration.configuration.scope &&
            req.body
        ) {
            let body = req.body as string;
            body += `&scope=${encodeURI(this.oidcSecurityService.configuration.configuration.scope)}`;
            req = req.clone({
                body: body
            });
        }

        return next.handle(req);
    }
}
