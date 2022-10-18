import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot } from '@angular/router';
import { Observable } from 'rxjs';
import { first, map } from 'rxjs/operators';
import { FeatureFlagService } from '../services/feature-flag.service';
import { Logger } from '../services/logging/logger-base';
import { pageUrls } from '../shared/page-url.constants';
import { SecurityServiceProvider } from './authentication/security-provider.service';
import { ISecurityService } from './authentication/security-service.interface';
import { VideoWebService } from '../services/api/video-web.service';
import { Hearing } from '../shared/models/hearing';
import { ProfileService } from '../services/api/profile.service';
import { ParticipantStatusUpdateService } from '../services/participant-status-update.service';
import { EventType } from '../services/clients/api-client';

@Injectable()
export class AuthBaseGuard {
    protected securityService: ISecurityService;
    constructor(
        securityServiceProviderService: SecurityServiceProvider,
        protected router: Router,
        protected logger: Logger,
        protected featureFlagService: FeatureFlagService
    ) {
        securityServiceProviderService.currentSecurityService$.subscribe(securityService => {
            this.securityService = securityService;
        });
    }

    isUserAuthorized(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
        return this.securityService.isAuthenticated$.pipe(
            map((isAuthorized: boolean) => {
                this.logger.debug('AuthorizationGuard, canActivate isAuthorized: ' + isAuthorized);
                if (!isAuthorized) {
                    this.featureFlagService
                        .getFeatureFlagByName('EJudFeature')
                        .pipe(first())
                        .subscribe(result => {
                            const routePath = result ? `/${pageUrls.IdpSelection}` : `/${pageUrls.Login}`;
                            this.router.navigate([routePath]);
                        });
                    return false;
                }
                return true;
            })
        );
    }

    async canConferenceBeActivate(
        next: ActivatedRouteSnapshot,
        auth: boolean,
        videoWebService: VideoWebService,
        urlToRoute: string,
        urlToRouteError: string,
        prefix: string
    ) {
        if (!this.isAuthorised(auth)) {
            return false;
        }
        const conferenceId = next.paramMap.get('conferenceId');
        this.logger.debug(`${prefix} Checking if user can view conference ${conferenceId}`);
        try {
            const data = await videoWebService.getConferenceById(conferenceId);
            const hearing = new Hearing(data);
            if (hearing.isPastClosedTime()) {
                this.logger.info(`${prefix} Returning back to hearing list because hearing has been closed for over 2 hours.`);
                this.router.navigate([urlToRoute]);
                return false;
            }
            return true;
        } catch (err) {
            this.logger.error(`${prefix} Could not get conference data. Returning home.`, err);
            this.router.navigate([urlToRouteError]);
            return false;
        }
    }

    async checkUserProfile(
        next: ActivatedRouteSnapshot,
        auth: boolean,
        userProfileService: ProfileService,
        prefix: string,
        validProfiles: Array<string>
    ) {
        if (!this.isAuthorised(auth)) {
            return false;
        }

        this.logger.debug(`${prefix} Checking if user is a ${validProfiles}`);
        try {
            const profile = await userProfileService.getUserProfile();
            const userProfile = profile.role.toString();
            if (validProfiles.includes(userProfile)) {
                this.logger.debug(`${prefix} User is a ${userProfile}`);
                return true;
            } else {
                this.logger.debug(`${prefix} User is not a ${validProfiles}. Going back home`);
                this.router.navigate([pageUrls.Home]);
                return false;
            }
        } catch (err) {
            this.logger.error(`${prefix} Failed to get user profile. Logging out.`, err);
            this.router.navigate([pageUrls.Logout]);
            return false;
        }
    }

    isAuthorised(auth: boolean): boolean {
        if (!auth) {
            this.router.navigate([pageUrls.Login]);
        }
        return auth;
    }
}
