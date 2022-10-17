import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from '@angular/router';
import { Logger } from '../services/logging/logger-base';
import { take } from 'rxjs/operators';
import { AuthBaseGuard } from './auth-base.guard';
import { SecurityServiceProvider } from './authentication/security-provider.service';
import { FeatureFlagService } from '../services/feature-flag.service';
import { VideoWebService } from '../services/api/video-web.service';

@Injectable({
    providedIn: 'root'
})
export class ConferenceGuard extends AuthBaseGuard implements CanActivate {
    constructor(
        securityServiceProviderService: SecurityServiceProvider,
        protected router: Router,
        protected logger: Logger,
        protected featureFlagService: FeatureFlagService,
        private videoWebService: VideoWebService
    ) {
        super(securityServiceProviderService, router, logger, featureFlagService);
    }

    async canActivate(next: ActivatedRouteSnapshot, state: RouterStateSnapshot): Promise<boolean> {
        return this.isUserAuthorized(next, state)
            .pipe(take(1))
            .toPromise()
            .then(async (auth: boolean) => {
                const result = await this.checkConferenceAuthorisation(auth, next, this.videoWebService, '[ConferenceGuard]');
                let canAuth = false;
                if (result != '') {
                    canAuth = true;
                }
                else {
                    this.router.navigate([result]);
                }
                return canAuth;
            });
    }
}
