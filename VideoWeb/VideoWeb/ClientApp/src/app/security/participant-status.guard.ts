import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from '@angular/router';
import { ProfileService } from '../services/api/profile.service';
import { Role } from '../services/clients/api-client';
import { Logger } from '../services/logging/logger-base';
import { ParticipantStatusUpdateService } from 'src/app/services/participant-status-update.service';
import { EventType } from 'src/app/services/clients/api-client';
import { ErrorService } from '../services/error.service';
import { AuthBaseGuard } from './auth-base.guard';
import { SecurityServiceProvider } from './authentication/security-provider.service';
import { FeatureFlagService } from '../services/feature-flag.service';
import { take } from 'rxjs/operators';
import { pageUrls } from '../shared/page-url.constants';

@Injectable({
    providedIn: 'root'
})
export class ParticipantStatusGuard extends AuthBaseGuard implements CanActivate {
    constructor(
        securityServiceProviderService: SecurityServiceProvider,
        protected userProfileService: ProfileService,
        protected router: Router,
        protected logger: Logger,
        protected featureFlagService: FeatureFlagService,
        private errorService: ErrorService,
        private participantStatusUpdateService: ParticipantStatusUpdateService
    ) {
        super(securityServiceProviderService, router, logger, featureFlagService);
    }

    async canActivate(next: ActivatedRouteSnapshot, state: RouterStateSnapshot): Promise<boolean> {
        return this.isUserAuthorized(next, state)
            .pipe(take(1))
            .toPromise()
            .then(async (auth: boolean) => {
                if (!auth) {
                    this.router.navigate([pageUrls.Login]);
                    return false;
                }

                this.logger.debug(`[ParticipantStatusGuard] Checking if user is a admin`);
                try {
                    const profile = await this.userProfileService.getUserProfile();

                    const startUrl = 'hearing-list';
                    // On Refresh set status back from NotSignedIn to Joining.
                    const conferenceId = next.paramMap.get('conferenceId');
                    const urlActive = this.router.url.indexOf(startUrl) > -1;

                    if (
                        conferenceId &&
                        (!this.router.navigated || urlActive) &&
                        (profile.role === Role.Representative ||
                            profile.role === Role.Individual ||
                            profile.role === Role.JudicialOfficeHolder ||
                            profile.role === Role.QuickLinkObserver ||
                            profile.role === Role.QuickLinkParticipant)
                    ) {
                        this.logger.debug(`[ParticipantStatusGuard] User is an individual.`);
                        this.participantStatusUpdateService
                            .postParticipantStatus(EventType.ParticipantJoining, conferenceId)
                            .then(() => {});
                        return true;
                    } else {
                        this.logger.debug(`[ParticipantStatusGuard] User is not an individual. Going back home`);
                        this.router.navigate([pageUrls.Home]);
                        return false;
                    }
                } catch (err) {
                    this.logger.error(`[ParticipantStatusGuard] Failed to get user profile. Logging out.`, err);
                    this.errorService.handleApiError(err);
                    this.router.navigate([pageUrls.Logout]);
                    return false;
                }
            });
    }
}
