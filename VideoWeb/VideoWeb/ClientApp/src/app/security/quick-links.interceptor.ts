import { Injectable, Injector } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpHeaders } from '@angular/common/http';
import { SecurityServiceProvider } from './authentication/security-provider.service';
import { Logger } from '../services/logging/logger-base';
import { Observable, of } from 'rxjs';
import { ISecurityService } from './authentication/security-service.interface';
import { mergeMap, switchMap } from 'rxjs/operators';

@Injectable()
export class QuickLinksInterceptor {
    private loggerPrefix = '[AuthenticationInterceptor] -';
    private currentIdp: string;
    private securityService: ISecurityService;

    constructor(private securityServiceProviderService: SecurityServiceProvider, private injector: Injector) {
        this.securityServiceProviderService.currentSecurityService$.subscribe(securityService => {
            this.securityService = securityService;
            this.currentIdp = securityServiceProviderService.currentIdp;
        });
    }

    intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
        const logger = this.injector.get(Logger);
        if (this.currentIdp !== 'quickLink') {
            return next.handle(request);
        }

        logger.debug(`${this.loggerPrefix} IDP is ${this.currentIdp}. Using Quick Links intercepter.`);
        return this.attachQuickLinkUsersToken(request).pipe(switchMap(req => next.handle(req)));
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

    private attachQuickLinkUsersToken(request: HttpRequest<unknown>): Observable<HttpRequest<unknown>> {
        return this.securityService.getAccessToken(this.currentIdp).pipe(
            mergeMap(token => {
                if (!token) {
                    return of(request);
                } else {
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
                    return of(newRequest);
                }
            })
        );
    }
}
