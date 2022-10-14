import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from '@angular/router';
import { Logger } from '../services/logging/logger-base';
import { pageUrls } from '../shared/page-url.constants';
import { take } from 'rxjs/operators';
import { AuthBaseGuard } from './auth-base.guard';
import { SecurityServiceProvider } from './authentication/security-provider.service';
import { FeatureFlagService } from '../services/feature-flag.service';
import { VideoWebService } from '../services/api/video-web.service';
import { Hearing } from '../shared/models/hearing';

@Injectable({
    providedIn: 'root'
})
export class ConferenceGuard extends AuthBaseGuard implements CanActivate {
    constructor(
        securityServiceProviderService: SecurityServiceProvider,
        protected router: Router,
        protected logger: Logger,
        protected featureFlagService: FeatureFlagService,
        private videoWebService: VideoWebService
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
                const conferenceId = next.paramMap.get('conferenceId');
                this.logger.debug(`[ConferenceGuard] Checking if user can view conference ${conferenceId}`);
                try {
                    const data = await this.videoWebService.getConferenceById(conferenceId);
                    const hearing = new Hearing(data);
                    if (hearing.isPastClosedTime()) {
                        this.logger.info(
                            '[ConferenceGuard] Returning back to hearing list because hearing has been closed for over 2 hours.'
                        );
                        this.router.navigate([pageUrls.JudgeHearingList]);
                        return false;
                    }
                    return true;
                } catch (err) {
                    this.logger.error(`[ConferenceGuard] Could not get conference data. Returning home.`, err);
                    this.router.navigate([pageUrls.Home]);
                    return false;
                }
            });
    }
}
