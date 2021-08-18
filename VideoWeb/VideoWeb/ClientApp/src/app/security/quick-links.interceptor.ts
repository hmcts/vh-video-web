import { Injectable, Injector } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpHeaders } from '@angular/common/http';
import { SecurityServiceProvider } from './authentication/security-provider.service';
import { SecurityConfigSetupService } from './security-config-setup.service';
import { IdpProviders } from './idp-providers';
import { Logger } from '../services/logging/logger-base';
import { Observable } from 'rxjs';

@Injectable()
export class QuickLinksInterceptor {
    private loggerPrefix = '[AuthenticationInterceptor] -';
    private currentIdp: IdpProviders;

    constructor(
        private securityConfigSetupService: SecurityConfigSetupService,
        private securityServiceProviderService: SecurityServiceProvider,
        private injector: Injector
    ) {
        this.securityConfigSetupService.currentIdp$.subscribe(newIdp => (this.currentIdp = newIdp));
    }

    intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
        const logger = this.injector.get(Logger);
        if (this.currentIdp) {
            if (this.currentIdp === IdpProviders.quickLink) {
                logger.debug(`${this.loggerPrefix} IDP is ${this.currentIdp}. Using Quick Links intercepter.`);
                return next.handle(this.attachQuickLinkUsersToken(request));
            }
        } else {
            logger.warn(`${this.loggerPrefix} Current IDP is not defined. Cannot intercept request.`);
        }

        return next.handle(request);
    }

    private cloneOldRequestAndAddNewHeaders(
        oldRequest: HttpRequest<unknown>,
        addNewHeaders: (headers: { [name: string]: string | string[] }) => void
    ): HttpRequest<unknown> {
        const headers: { [name: string]: string | string[] } = {};

        for (const key of oldRequest.headers.keys()) {
            headers[key] = oldRequest.headers.getAll(key);
        }

        addNewHeaders(headers);

        return oldRequest.clone({
            headers: new HttpHeaders(headers)
        });
    }

    private attachQuickLinkUsersToken(request: HttpRequest<unknown>): HttpRequest<unknown> {
        const token = this.securityServiceProviderService.getSecurityService().getToken();
        const newRequest = this.cloneOldRequestAndAddNewHeaders(request, headers => {
            headers['Authorization'] = `Bearer ${token}`;
            headers['Content-Type'] = 'application/json';
        });
        const logger = this.injector.get(Logger);
        logger.debug(`${this.loggerPrefix} Attached quick links token.`, {
            token: token,
            requestUrl: newRequest.url,
            requestHeaders: newRequest.headers
        });

        return newRequest;
    }
}
