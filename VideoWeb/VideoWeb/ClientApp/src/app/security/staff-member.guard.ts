import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from '@angular/router';
import { ProfileService } from '../services/api/profile.service';
import { Role } from '../services/clients/api-client';
import { Logger } from '../services/logging/logger-base';

@Injectable({
    providedIn: 'root'
})
export class StaffMemberGuard implements CanActivate {
    constructor(private userProfileService: ProfileService, private router: Router, private logger: Logger) {}

    async canActivate(next: ActivatedRouteSnapshot, state: RouterStateSnapshot): Promise<boolean> {
        this.logger.debug(`[StaffMemberGuard] Checking if user is a Staff Member`);
        try {
            const profile = await this.userProfileService.getUserProfile();
            if (profile.role === Role.StaffMember) {
                this.logger.debug(`[StaffMemberGuard] User is a StaffMemberGuard.`);
                return true;
            } else {
                this.logger.debug(`[StaffMemberGuard] User is not a Staff Member. Going back home`);
                this.router.navigate(['/home']);
                return false;
            }
        } catch (err) {
            this.logger.error(`[StaffMemberGuard] Failed to get user profile. Logging out.`, err);
            this.router.navigate(['/logout']);
            return false;
        }
    }
}
