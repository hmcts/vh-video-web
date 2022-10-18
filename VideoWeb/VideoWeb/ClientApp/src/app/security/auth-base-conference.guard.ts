import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from '@angular/router';
import { first, map, take } from 'rxjs/operators';
import { FeatureFlagService } from '../services/feature-flag.service';
import { Logger } from '../services/logging/logger-base';
import { pageUrls } from '../shared/page-url.constants';
import { SecurityServiceProvider } from './authentication/security-provider.service';
import { ISecurityService } from './authentication/security-service.interface';
import { AuthBaseGuard } from './auth-base.guard';
import { VideoWebService } from '../services/api/video-web.service';

@Injectable()
export class AuthBaseConferenceGuard extends AuthBaseGuard implements CanActivate {
    protected securityService: ISecurityService;
    private urlToRoute: string;
    private urlToRouteError: string;
    private prefix: string;
    constructor(
        securityServiceProviderService: SecurityServiceProvider,
        protected router: Router,
        protected logger: Logger,
        protected featureFlagService: FeatureFlagService,
        private videoWebService: VideoWebService,
        urlToRoute: string,
        urlToRouteError: string,
        prefix: string
    ) {
        super(securityServiceProviderService, router, logger, featureFlagService);
        this.urlToRoute = urlToRoute;
        this.urlToRouteError = urlToRouteError;
        this.prefix = prefix;
    }

    async canActivate(next: ActivatedRouteSnapshot, state: RouterStateSnapshot): Promise<boolean> {
        return this.isUserAuthorized(next, state)
            .pipe(take(1))
            .toPromise()
            .then(async (auth: boolean) => {
                return await this.canConferenceBeActivated(
                    next,
                    auth,
                    this.videoWebService,
                    this.urlToRoute,
                    this.urlToRouteError,
                    this.prefix
                );
            });
    }
}
