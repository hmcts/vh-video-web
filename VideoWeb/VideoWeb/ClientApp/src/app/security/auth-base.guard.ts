import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot } from '@angular/router';
import { Observable, combineLatest } from 'rxjs';
import { first, map } from 'rxjs/operators';
import { FeatureFlagService } from '../services/feature-flag.service';
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
        protected logger: Logger,
        protected featureFlagService: FeatureFlagService
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
            map((isAuthorized: boolean) => {
                this.logger.debug('AuthorizationGuard, canActivate isAuthorized: ' + isAuthorized);
                if (!isAuthorized) {
                    this.featureFlagService
                        .getFeatureFlagByName('EJudFeature')
                        .pipe(first())
                        .subscribe(result => {
                            const routePath = result ? `/${pageUrls.IdpSelection}` : `/${pageUrls.Login}`;
                            this.router.navigate([routePath]);
                        });
                    return false;
                }
                return true;
            })
        );
    }
}
