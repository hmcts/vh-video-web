import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { SecurityServiceProvider } from './authentication/security-provider.service';
import { ISecurityService } from './authentication/security-service.interface';
import { mergeMap } from 'rxjs/operators';

@Injectable({
    providedIn: 'root'
})
export class MultipleIdpInterceptorService implements HttpInterceptor {
    currentIdp: string;
    securityService: ISecurityService;

    constructor(private securityServiceProviderService: SecurityServiceProvider) {
        this.securityServiceProviderService.currentSecurityService$.subscribe(securityService => {
            this.securityService = securityService;
            this.currentIdp = securityServiceProviderService.currentIdp;
        });
    }
    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        if (this.currentIdp === 'quickLink') {
            return next.handle(req);
        }
        // TODO: use a single interceptor to handle IDP configurations
        return this.securityService.getAccessToken(this.currentIdp).pipe(
            mergeMap(token => {
                const authReq = req.clone({
                    headers: req.headers.set('Authorization', 'Bearer ' + token)
                });
                return next.handle(authReq);
            })
        );
    }
}
