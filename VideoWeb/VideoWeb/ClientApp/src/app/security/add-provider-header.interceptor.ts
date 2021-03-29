import { HttpInterceptor, HttpHandler, HttpEvent, HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { OidcSecurityService } from 'angular-auth-oidc-client';
import { Observable } from 'rxjs';
import { Logger } from '../services/logging/logger-base';
import { OidcConfigSetupService } from './oidc-config-setup.service';

@Injectable()
export class AddProviderHeaderInterceptor implements HttpInterceptor {
    constructor(
        private oidcSecurityService: OidcSecurityService,
        private logger: Logger,
        private oidcConfigSetupService: OidcConfigSetupService
    ) {}

    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        const secureRoutes = this.oidcSecurityService.configuration?.configuration.secureRoutes;

        if (!secureRoutes) {
            return next.handle(req);
        }

        const matchingRoute = secureRoutes.find(x => req.url.startsWith(x));
        if (!matchingRoute) {
            return next.handle(req);
        }

        const provider = this.oidcConfigSetupService.getIdp();
        this.logger.debug(`[AddProviderHeaderInterceptor] - Setting oidc-provider header to ${provider}`);
        req = req.clone({
            headers: req.headers.set('oidc-provider', provider)
        });

        return next.handle(req);
    }
}
