import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from '@angular/router';
import { take } from 'rxjs/operators';
import { ProfileService } from '../services/api/profile.service';
import { Role } from '../services/clients/api-client';
import { Logger } from '../services/logging/logger-base';
import { AuthGuard } from './auth.guard';

@Injectable({
    providedIn: 'root'
})
export class ParticipantGuard implements CanActivate {
    constructor(
        private userProfileService: ProfileService,
        private router: Router,
        private logger: Logger,
        private _authGuard: AuthGuard
    ) {}

    async canActivate(next: ActivatedRouteSnapshot, state: RouterStateSnapshot): Promise<boolean> {
        return this._authGuard
            .canActivate(next, state)
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
