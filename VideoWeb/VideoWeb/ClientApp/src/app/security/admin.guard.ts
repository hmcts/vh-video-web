import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from '@angular/router';
import { ProfileService } from '../services/api/profile.service';
import { Role } from '../services/clients/api-client';
import { Logger } from '../services/logging/logger-base';

@Injectable({
    providedIn: 'root'
})
export class AdminGuard implements CanActivate {
    constructor(private userProfileService: ProfileService, private router: Router, private logger: Logger) {}

    async canActivate(next: ActivatedRouteSnapshot, state: RouterStateSnapshot): Promise<boolean> {
        this.logger.debug(`[AdminGuard] Checking if user is an admin`);
        try {
            const profile = await this.userProfileService.getUserProfile();
            if (profile.role === Role.VideoHearingsOfficer) {
                this.logger.debug(`[AdminGuard] User is an admin.`);
                return true;
            } else {
                this.logger.debug(`[AdminGuard] User is not admin. Going back home.`);
                this.router.navigate(['/home']);
                return false;
            }
        } catch (err) {
            this.logger.error(`[AdminGuard] Failed to get user profile. Logging out.`, err);
            this.router.navigate(['/logout']);
            return false;
        }
    }
}
