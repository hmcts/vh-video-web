import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from '@angular/router';
import { ProfileService } from '../services/api/profile.service';
import { Role } from '../services/clients/api-client';
import { Logger } from '../services/logging/logger-base';
import { ParticipantStatusUpdateService } from 'src/app/services/participant-status-update.service';
import { EventType } from 'src/app/services/clients/api-client';

@Injectable({
    providedIn: 'root'
})
export class ParticipantStatusGuard implements CanActivate {
    constructor(
        private userProfileService: ProfileService,
        private router: Router,
        private logger: Logger,
        private participantStatusUpdateService: ParticipantStatusUpdateService
    ) {}

    async canActivate(next: ActivatedRouteSnapshot, state: RouterStateSnapshot): Promise<boolean> {
        try {
            const profile = await this.userProfileService.getUserProfile();

            // On Refresh set status back from NotSignedIn to Joining.

            const conferenceId = next.paramMap.get('conferenceId');

            if (conferenceId && !this.router.navigated && (profile.role === Role.Representative || profile.role === Role.Individual)) {
                this.participantStatusUpdateService.postParticipantStatus(EventType.ParticipantJoining, conferenceId).then(() => {});
            }
        } catch (err) {
            this.logger.error(`Could not reset participant status to Joining.`, err);
            return true;
        }
        return true;
    }
}
