import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot } from '@angular/router';
import { ProfileService } from '../services/api/profile.service';
import { Logger } from '../services/logging/logger-base';
import { ParticipantStatusUpdateService } from 'src/app/services/participant-status-update.service';
import { EventType } from 'src/app/services/clients/api-client';
import { ErrorService } from '../services/error.service';
import { PARTICIPANT_AND_JUDICIAL_ROLES } from '../shared/user-roles';

@Injectable({
    providedIn: 'root'
})
export class ParticipantStatusGuard  {
    constructor(
        private userProfileService: ProfileService,
        private router: Router,
        private logger: Logger,
        private errorService: ErrorService,
        private participantStatusUpdateService: ParticipantStatusUpdateService
    ) {}

    async canActivate(next: ActivatedRouteSnapshot, state: RouterStateSnapshot): Promise<boolean> {
        this.logger.debug('[ParticipantStatusGuard] Determining participant status');
        try {
            const profile = await this.userProfileService.getUserProfile();

            const startUrl = 'hearing-list';

            // On Refresh set status back from NotSignedIn to Joining.
            const conferenceId = next.paramMap.get('conferenceId');
            const urlActive = this.router.url.indexOf(startUrl) > -1;

            if (
                conferenceId &&
                (!this.router.navigated || urlActive) &&
                profile.roles.some(role => PARTICIPANT_AND_JUDICIAL_ROLES.includes(role))
            ) {
                this.logger.debug('[ParticipantStatusGuard] Refresh detected. Resetting participant status to joining');
                this.participantStatusUpdateService.postParticipantStatus(EventType.ParticipantJoining, conferenceId).then(() => {});
            }
        } catch (err) {
            this.logger.error('[ParticipantStatusGuard] Could not reset participant status to Joining.', err);
            this.errorService.handleApiError(err);
        }

        return true;
    }
}
