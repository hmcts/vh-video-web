import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from '@angular/router';
import { ProfileService } from '../services/api/profile.service';
import { Role } from '../services/clients/api-client';
import { Logger } from '../services/logging/logger-base';

@Injectable({
    providedIn: 'root'
})
export class JudgeGuard implements CanActivate {
    constructor(private userProfileService: ProfileService, private router: Router, private logger: Logger) {}

    async canActivate(next: ActivatedRouteSnapshot, state: RouterStateSnapshot): Promise<boolean> {
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
    }
}
