import { HttpInterceptor, HttpHandler, HttpEvent, HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { SecurityServiceProviderService } from './authentication/security-service-provider.service';
import { ISecurityService } from './authentication/security-service.interface';

@Injectable()
export class RefreshTokenParameterInterceptor implements HttpInterceptor {
    private securityService: ISecurityService;
    constructor(securityServiceProviderService: SecurityServiceProviderService) {
        securityServiceProviderService.currentSecurityService$.subscribe(securityService => (this.securityService = securityService));
    }

    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        if (
            req.method === 'POST' &&
            req.url.endsWith('/oauth2/v2.0/token') &&
            this.securityService.configuration().configuration?.scope &&
            req.body
        ) {
            let body = req.body as string;
            body += `&scope=${encodeURI(this.securityService.configuration().configuration.scope)}`;
            req = req.clone({
                body: body
            });
        }

        return next.handle(req);
    }
}
