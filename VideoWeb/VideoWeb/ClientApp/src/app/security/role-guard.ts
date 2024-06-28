import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot } from '@angular/router';
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
export abstract class RoleGuard extends AuthBaseGuard {
    protected abstract roles: Role[];
    protected abstract loggerPrefix: string;

    constructor(
        securityServiceProviderService: SecurityServiceProvider,
        protected userProfileService: ProfileService,
        protected router: Router,
        protected logger: Logger,
        protected ldService: LaunchDarklyService
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

                this.logger.debug(`${this.loggerPrefix} Checking if user has roles: ${this.roles.join(', ')}`);
                try {
                    const profile = await this.userProfileService.getUserProfile();
                    if (this.roles.some(role => profile.roles.includes(role))) {
                        this.logger.debug(`${this.loggerPrefix} User has one of the required roles: ${this.roles.join(', ')}`);
                        return true;
                    } else {
                        this.logger.debug(`${this.loggerPrefix} User does not have any of the required roles. Going back home`);
                        this.router.navigate(['/home']);
                        return false;
                    }
                } catch (err) {
                    this.logger.error(`${this.loggerPrefix} Failed to get user profile. Logging out.`, err);
                    this.router.navigate(['/logout']);
                    return false;
                }
            });
    }
}
