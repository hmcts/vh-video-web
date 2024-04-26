import { HttpInterceptor, HttpHandler, HttpEvent, HttpRequest } from '@angular/common/http';
import { Injectable, Injector } from '@angular/core';
import { Observable } from 'rxjs';
import { first, map, switchMap, tap } from 'rxjs/operators';
import { Logger } from '../services/logging/logger-base';
import { SecurityServiceProvider } from './authentication/security-provider.service';
import { ISecurityService } from './authentication/security-service.interface';
import { IdpProviders } from './idp-providers';

@Injectable()
export class RefreshTokenParameterInterceptor implements HttpInterceptor {
    private loggerPrefix = '[RefreshTokenParameterInterceptor] -';
    private securityService: ISecurityService;
    private idp: IdpProviders;

    constructor(
        securityServiceProviderService: SecurityServiceProvider,
        private injector: Injector
    ) {
        securityServiceProviderService.currentIdp$
            .pipe(
                tap(idp => (this.idp = idp)),
                map(idp => (idp === IdpProviders.quickLink ? null : securityServiceProviderService.getSecurityService(idp)))
            )
            .subscribe(securityService => (this.securityService = securityService));
    }

    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        if (req.method === 'POST' && req.url.endsWith('/oauth2/v2.0/token')) {
            if (!this.securityService) {
                const logger = this.injector.get(Logger);
                logger.debug(`${this.loggerPrefix} security service is falsey. Not using refresh tokens.`, {
                    Idp: this.idp
                });
                return next.handle(req);
            }

            return this.securityService.getConfiguration(this.idp).pipe(
                first(),
                switchMap(config => {
                    if (config.scope && req.body) {
                        let body = req.body as string;
                        body += `&scope=${encodeURI(config.scope)}`;
                        req = req.clone({
                            body: body
                        });
                    }
                    return next.handle(req);
                })
            );
        }

        return next.handle(req);
    }
}
