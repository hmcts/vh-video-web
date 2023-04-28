import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot } from '@angular/router';
import { Observable, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { Logger } from '../services/logging/logger-base';
import { pageUrls } from '../shared/page-url.constants';
import { SecurityServiceProvider } from './authentication/security-provider.service';
import { ISecurityService } from './authentication/security-service.interface';
import { FEATURE_FLAGS, LaunchDarklyService } from '../services/launch-darkly.service';

@Injectable()
export class AuthBaseGuard {
    protected securityService: ISecurityService;
    constructor(
        securityServiceProviderService: SecurityServiceProvider,
        protected router: Router,
        protected logger: Logger,
        protected ldService: LaunchDarklyService
    ) {
        securityServiceProviderService.currentSecurityService$.subscribe(securityService => {
            this.securityService = securityService;
        });
    }

    isUserAuthorized(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
        return this.securityService.isAuthenticated$.pipe(
            switchMap(isAuthenticated => {
                if (!isAuthenticated) {
                    this.logger.debug(`${this.constructor.name} - User is not authenticated, redirecting to login page`);
                    this.ldService.getFlag(FEATURE_FLAGS.multiIdpSelection).subscribe(featureEnabled => {
                        this.logger.debug(
                            `${this.constructor.name} - LaunchDarkly flag value: ${FEATURE_FLAGS.multiIdpSelection} = ${featureEnabled}`
                        );
                        const routePath = featureEnabled ? `/${pageUrls.IdpSelection}` : `/${pageUrls.Login}`;
                        this.router.navigate([routePath]);
                    });
                    return of(false);
                }
                this.logger.debug(`${this.constructor.name} - User is authenticated, allowing access`);
                return of(true);
            })
        );
    }
}
