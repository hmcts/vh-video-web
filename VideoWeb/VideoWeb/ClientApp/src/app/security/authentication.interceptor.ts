import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpHeaders } from '@angular/common/http';
import { SecurityServiceProviderService } from './authentication/security-service-provider.service';
import { SecurityConfigSetupService } from './security-config-setup.service';
import { IdpProviders } from './idp-providers';
import { Logger } from '../services/logging/logger-base';
import { Observable } from 'rxjs';

@Injectable()
export class AuthenticationInterceptor {
    private loggerPrefix = '[AuthenticationInterceptor] -';
    private currentIdp: IdpProviders;

    constructor(
        private securityConfigSetupService: SecurityConfigSetupService,
        private securityServiceProviderService: SecurityServiceProviderService,
        private vhLoggerService: Logger
    ) {
        this.securityConfigSetupService.currentIdp$.subscribe(newIdp => (this.currentIdp = newIdp));
    }

    intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
        if (this.currentIdp) {
            switch (this.currentIdp) {
                case IdpProviders.magicLink:
                    this.vhLoggerService.debug(`${this.loggerPrefix} IDP is ${this.currentIdp}. Using Magic Links intercepter.`);
                    return next.handle(this.attachMagicLinkUsersToken(request));
            }
        } else {
            this.vhLoggerService.warn(`${this.loggerPrefix} Current IDP is not defined. Cannot intercept request.`);
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

    private attachMagicLinkUsersToken(request: HttpRequest<unknown>): HttpRequest<unknown> {
        const token = this.securityServiceProviderService.getSecurityService().getToken();

        const newRequest = this.cloneOldRequestAndAddNewHeaders(request, headers => {
            headers['Authorization'] = `Bearer ${token}`;
            headers['Content-Type'] = 'application/json';
        });

        this.vhLoggerService.debug(`${this.loggerPrefix} Attached magic links token.`, {
            token: token,
            requestUrl: request.url,
            requestHeaders: request.headers
        });

        return newRequest;
    }
}
