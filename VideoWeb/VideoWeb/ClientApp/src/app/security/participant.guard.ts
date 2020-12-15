import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from '@angular/router';
import { ProfileService } from '../services/api/profile.service';
import { Role } from '../services/clients/api-client';
import { Logger } from '../services/logging/logger-base';

@Injectable({
    providedIn: 'root'
})
export class ParticipantGuard implements CanActivate {
    constructor(private userProfileService: ProfileService, private router: Router, private logger: Logger) {}

    async canActivate(next: ActivatedRouteSnapshot, state: RouterStateSnapshot): Promise<boolean> {
        this.logger.debug(`[ParticipantGuard] Checking if user is a representative or individual.`);
        try {
            const profile = await this.userProfileService.getUserProfile();
            if (profile.role === Role.Representative || profile.role === Role.Individual || profile.role === Role.JudicialOfficeHolder) {
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
    }
}
