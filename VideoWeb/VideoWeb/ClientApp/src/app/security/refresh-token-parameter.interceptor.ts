import { HttpInterceptor, HttpHandler, HttpEvent, HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { Logger } from '../services/logging/logger-base';
import { SecurityServiceProviderService } from './authentication/security-service-provider.service';
import { ISecurityService } from './authentication/security-service.interface';
import { IdpProviders } from './idp-providers';

@Injectable()
export class RefreshTokenParameterInterceptor implements HttpInterceptor {
    private loggerPrefix = '[RefreshTokenParameterInterceptor] -';
    private securityService: ISecurityService;
    private idp: IdpProviders;

    constructor(securityServiceProviderService: SecurityServiceProviderService, private logger: Logger) {
        securityServiceProviderService.currentIdp$
            .pipe(
                tap(idp => (this.idp = idp)),
                map(idp => (idp === IdpProviders.magicLink ? null : securityServiceProviderService.getSecurityService(idp)))
            )
            .subscribe(securityService => (this.securityService = securityService));
    }

    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        if (!this.securityService) {
            this.logger.debug(`${this.loggerPrefix} security service is falsey. Not using refresh tokens.`, {
                Idp: this.idp
            });
            return next.handle(req);
        }

        if (
            req.method === 'POST' &&
            req.url.endsWith('/oauth2/v2.0/token') &&
            this.securityService.configuration.configuration.scope &&
            req.body
        ) {
            let body = req.body as string;
            body += `&scope=${encodeURI(this.securityService.configuration.configuration.scope)}`;
            req = req.clone({
                body: body
            });
        }

        return next.handle(req);
    }
}
