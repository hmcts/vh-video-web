import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from '@angular/router';
import { take } from 'rxjs/operators';
import { ProfileService } from '../services/api/profile.service';
import { Role } from '../services/clients/api-client';
import { Logger } from '../services/logging/logger-base';
import { AuthBaseGuard } from './auth-base.guard';
import { SecurityServiceProvider } from './authentication/security-provider.service';
import { LaunchDarklyService } from '../services/launch-darkly.service';

@Injectable({
    providedIn: 'root'
})
export class ParticipantGuard extends AuthBaseGuard implements CanActivate {
    constructor(
        protected ldService: LaunchDarklyService,
        securityServiceProviderService: SecurityServiceProvider,
        protected userProfileService: ProfileService,
        protected router: Router,
        protected logger: Logger
    ) {
        super(securityServiceProviderService, router, logger, ldService);
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
                        profile.roles.includes(Role.Representative) ||
                        profile.roles.includes(Role.Individual) ||
                        profile.roles.includes(Role.QuickLinkParticipant) ||
                        profile.roles.includes(Role.QuickLinkObserver)
                    ) {
                        this.logger.debug('[ParticipantGuard] User is a representative or individual.');
                        return true;
                    } else {
                        this.logger.debug('[ParticipantGuard] User is not a representative or individual. Going home.');
                        this.router.navigate(['/home']);
                        return false;
                    }
                } catch (err) {
                    this.logger.error('[ParticipantGuard] Failed to get user profile. Logging out.', err);
                    this.router.navigate(['/logout']);
                    return false;
                }
            });
    }
}
