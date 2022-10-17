import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from '@angular/router';
import { VideoWebService } from '../services/api/video-web.service';
import { Logger } from '../services/logging/logger-base';
import { pageUrls } from '../shared/page-url.constants';
import { AuthBaseGuard } from './auth-base.guard';
import { SecurityServiceProvider } from './authentication/security-provider.service';
import { FeatureFlagService } from '../services/feature-flag.service';
import { take } from 'rxjs/operators';

@Injectable({
    providedIn: 'root'
})
export class ParticipantWaitingRoomGuard extends AuthBaseGuard implements CanActivate {
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
                return await this.canConferenceBeActivate(next, auth, this.videoWebService, pageUrls.ParticipantHearingList, pageUrls.Logout, '[ParticipantWaitingRoomGuard]');
            });
    }
}
