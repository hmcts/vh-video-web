import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot } from '@angular/router';
import { switchMap } from 'rxjs/operators';
import { Observable, of, combineLatest } from 'rxjs';
import { Logger } from '../services/logging/logger-base';
import { pageUrls } from '../shared/page-url.constants';
import { SecurityServiceProvider } from './authentication/security-provider.service';
import { ISecurityService } from './authentication/security-service.interface';

@Injectable()
export class AuthBaseGuard {
    currentIdp: string;

    protected securityService: ISecurityService;

    constructor(
        securityServiceProviderService: SecurityServiceProvider,
        protected router: Router,
        protected logger: Logger
    ) {
        combineLatest([securityServiceProviderService.currentSecurityService$, securityServiceProviderService.currentIdp$]).subscribe(
            ([service, idp]) => {
                this.securityService = service;
                this.currentIdp = idp;
            }
        );
    }

    isUserAuthorized(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
        return this.securityService.isAuthenticated(this.currentIdp).pipe(
            switchMap(isAuthenticated => {
                if (!isAuthenticated) {
                    this.logger.debug(`${this.constructor.name} - User is not authenticated, redirecting to login page`);
                    const routePath = `/${pageUrls.IdpSelection}`;
                    this.router.navigate([routePath]);
                    return of(false);
                }
                this.logger.debug(`${this.constructor.name} - User is authenticated, allowing access`);
                return of(true);
            })
        );
    }
}
