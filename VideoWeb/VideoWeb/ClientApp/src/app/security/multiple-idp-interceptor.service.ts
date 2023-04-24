import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, combineLatest } from 'rxjs';
import { SecurityServiceProvider } from './authentication/security-provider.service';
import { ISecurityService } from './authentication/security-service.interface';
import { mergeMap } from 'rxjs/operators';
import { IdpProviders } from './idp-providers';

@Injectable({
    providedIn: 'root'
})
export class MultipleIdpInterceptorService implements HttpInterceptor {
    currentIdp: IdpProviders;
    securityService: ISecurityService;

    constructor(private securityServiceProviderService: SecurityServiceProvider) {
        combineLatest([
            this.securityServiceProviderService.currentSecurityService$,
            this.securityServiceProviderService.currentIdp$
        ]).subscribe(([service, idp]) => {
            this.securityService = service;
            this.currentIdp = idp;
        });
    }
    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        if (this.currentIdp === IdpProviders.quickLink) {
            return next.handle(req);
        }

        return this.securityService.getAccessToken(this.currentIdp).pipe(
            mergeMap(token => {
                if (token) {
                    const authReq = req.clone({
                        headers: req.headers.set('Authorization', 'Bearer ' + token)
                    });
                    return next.handle(authReq);
                }
                return next.handle(req);
            })
        );
    }
}
