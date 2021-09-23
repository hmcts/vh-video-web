import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from '@angular/router';
import { Observable } from 'rxjs';
import { first, map } from 'rxjs/operators';
import { FeatureFlagService } from '../services/feature-flag.service';
import { Logger } from '../services/logging/logger-base';
import { pageUrls } from '../shared/page-url.constants';
import { SecurityServiceProvider } from './authentication/security-provider.service';
import { ISecurityService } from './authentication/security-service.interface';

@Injectable()
export class AuthGuard implements CanActivate {
    private securityService: ISecurityService;
    constructor(
        securityServiceProviderService: SecurityServiceProvider,
        private router: Router,
        private logger: Logger,
        private featureFlagService: FeatureFlagService
    ) {
        securityServiceProviderService.currentSecurityService$.subscribe(securityService => {
            this.securityService = securityService;
        });
    }

    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
        return this.securityService.isAuthenticated$.pipe(
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
