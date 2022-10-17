import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot } from '@angular/router';
import { Observable } from 'rxjs';
import { first, map } from 'rxjs/operators';
import { FeatureFlagService } from '../services/feature-flag.service';
import { Logger } from '../services/logging/logger-base';
import { pageUrls } from '../shared/page-url.constants';
import { SecurityServiceProvider } from './authentication/security-provider.service';
import { ISecurityService } from './authentication/security-service.interface';
import { Hearing } from '../shared/models/hearing';
import { VideoWebService } from '../services/api/video-web.service';
import { ProfileService } from '../services/api/profile.service';
import { Role } from '../services/clients/api-client';

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

    async checkConferenceAuthorisation(
        auth: boolean,
        next: ActivatedRouteSnapshot,
        videoWebService: VideoWebService,
        prefix: string
    ): Promise<string> {
        if (!auth) {
            //this.router.navigate([pageUrls.Login]);
            return pageUrls.Login;
        }
        const conferenceId = next.paramMap.get('conferenceId');
        this.logger.debug(`${prefix} - Checking if user can view conference ${conferenceId}`);
        try {
            const data = await videoWebService.getConferenceById(conferenceId);
            const hearing = new Hearing(data);
            if (hearing.isPastClosedTime()) {
                this.logger.info(`${prefix}  - Returning back to hearing list because hearing has been closed for over 2 hours.`);
                //this.router.navigate([pageUrls.ParticipantHearingList]);
                return pageUrls.ParticipantHearingList;
            }
            return '';
        } catch (err) {
            this.logger.error(`${prefix} Could not get conference data. Returning home.`, err);
            //this.router.navigate([pageUrls.Logout]);
            return pageUrls.Logout;
        }
    }

    async checkUserProfileAuthorisation(
        auth: boolean,
        next: ActivatedRouteSnapshot,
        userProfileService: ProfileService,
        prefix: string
    ): Promise<string> {
        let postfix: string;
        switch (prefix) {
            case '[StaffMemberGuard]':
                postfix = 'Staff Member';
                break;
            case '[JudgeGuard]':
                postfix = 'judge or JOH';
                break;
            case '[AdminGuard]':
                postfix = 'admin';
                break;
        }
        if (!auth) {
            return pageUrls.Login;
        }
        this.logger.debug(`${prefix} Checking if user is a Staff Member`);
        try {
            const profile = await userProfileService.getUserProfile();
            if (profile.role === Role.StaffMember) {
                this.logger.debug(`${prefix} User is a ${postfix}.`);
                return '';
            } else {
                this.logger.debug(`${prefix} User is not a ${postfix}. Going back home`);
                return pageUrls.Home;
            }
        } catch (err) {
            this.logger.error(`${prefix} Failed to get user profile. Logging out.`, err);
            return pageUrls.Logout;
        }
    }
}
