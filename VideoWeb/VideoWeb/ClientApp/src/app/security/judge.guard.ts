import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from '@angular/router';
import { take } from 'rxjs/operators';
import { ProfileService } from '../services/api/profile.service';
import { Role } from '../services/clients/api-client';
import { FeatureFlagService } from '../services/feature-flag.service';
import { Logger } from '../services/logging/logger-base';
import { AuthBaseGuard } from './auth-base.guard';
import { SecurityServiceProvider } from './authentication/security-provider.service';

@Injectable({
    providedIn: 'root'
})
export class JudgeGuard extends AuthBaseGuard implements CanActivate {
    constructor(
        securityServiceProviderService: SecurityServiceProvider,
        protected userProfileService: ProfileService,
        protected router: Router,
        protected logger: Logger,
        protected featureFlagService: FeatureFlagService
    ) {
        super(securityServiceProviderService, router, logger, featureFlagService);
    }

    async canActivate(next: ActivatedRouteSnapshot, state: RouterStateSnapshot): Promise<boolean> {
        return this.isUserAuthorized(next, state)
            .pipe(take(1))
            .toPromise()
            .then(async (auth: boolean) => {
                if (!auth) {
                    this.router.navigate(['/login']);
                    return false;
                }

                this.logger.debug(`[JudgeGuard] Checking if user is a judge or JOH`);
                try {
                    const profile = await this.userProfileService.getUserProfile();
                    if (profile.role === Role.Judge || profile.role === Role.JudicialOfficeHolder) {
                        this.logger.debug(`[JudgeGuard] User is a judge or JOH.`);
                        return true;
                    } else {
                        this.logger.debug(`[JudgeGuard] User is not a judge. Going back home`);
                        this.router.navigate(['/home']);
                        return false;
                    }
                } catch (err) {
                    this.logger.error(`[JudgeGuard] Failed to get user profile. Logging out.`, err);
                    this.router.navigate(['/logout']);
                    return false;
                }
            });
    }
}
