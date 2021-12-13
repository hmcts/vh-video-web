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
export class ParticipantGuard extends AuthBaseGuard implements CanActivate {
    constructor(
        protected featureFlagService: FeatureFlagService,
        securityServiceProviderService: SecurityServiceProvider,
        protected userProfileService: ProfileService,
        protected router: Router,
        protected logger: Logger
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
                try {
                    const profile = await this.userProfileService.getUserProfile();
                    if (
                        profile.role === Role.Representative ||
                        profile.role === Role.Individual ||
                        profile.role === Role.QuickLinkParticipant ||
                        profile.role === Role.QuickLinkObserver
                    ) {
                        this.logger.debug(`[ParticipantGuard] User is a representative or individual.`);
                        return true;
                    } else {
                        this.logger.debug(`[ParticipantGuard] User is not a representative or individual. Going home.`);
                        this.router.navigate(['/home']);
                        return false;
                    }
                } catch (err) {
                    this.logger.error(`[ParticipantGuard] Failed to get user profile. Logging out.`, err);
                    this.router.navigate(['/logout']);
                    return false;
                }
            });
    }
}
