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
export class JudicialOfficeHolderGuard extends AuthBaseGuard {
    private _loggerPrefix = '[JudicialOfficeHolderGuard]';

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

                this.logger.debug(`${this._loggerPrefix} Checking if user is a JOH`);
                try {
                    const profile = await this.userProfileService.getUserProfile();
                    if (profile.roles.includes(Role.JudicialOfficeHolder)) {
                        this.logger.debug(`${this._loggerPrefix} User is a JOH.`);
                        return true;
                    } else {
                        this.logger.debug(`${this._loggerPrefix} User is not a JOH. Going back home`);
                        this.router.navigate(['/home']);
                        return false;
                    }
                } catch (err) {
                    this.logger.error(`${this._loggerPrefix} Failed to get user profile. Logging out.`, err);
                    this.router.navigate(['/logout']);
                    return false;
                }
            });
    }
}
