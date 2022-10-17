import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from '@angular/router';
import { ProfileService } from '../services/api/profile.service';
import { Role } from '../services/clients/api-client';
import { Logger } from '../services/logging/logger-base';
import { AuthBaseGuard } from './auth-base.guard';
import { SecurityServiceProvider } from './authentication/security-provider.service';
import { FeatureFlagService } from '../services/feature-flag.service';
import { take } from 'rxjs/operators';
import { pageUrls } from '../shared/page-url.constants';

@Injectable({
    providedIn: 'root'
})
export class StaffMemberGuard extends AuthBaseGuard implements CanActivate {
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
                    this.router.navigate([pageUrls.Login]);
                    return false;
                }

                this.logger.debug(`[StaffMemberGuard] Checking if user is a Staff Member`);
                try {
                    const profile = await this.userProfileService.getUserProfile();
                    if (profile.role === Role.StaffMember) {
                        this.logger.debug(`[StaffMemberGuard] User is a Staff Member.`);
                        return true;
                    } else {
                        this.logger.debug(`[StaffMemberGuard] User is not a Staff Member. Going back home`);
                        this.router.navigate([pageUrls.Home]);
                        return false;
                    }
                } catch (err) {
                    this.logger.error(`[StaffMemberGuard] Failed to get user profile. Logging out.`, err);
                    this.router.navigate([pageUrls.Logout]);
                    return false;
                }
            });
    }
}
