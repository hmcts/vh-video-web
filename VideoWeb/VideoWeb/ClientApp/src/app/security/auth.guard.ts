import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from '@angular/router';
import { Observable } from 'rxjs';
import { Logger } from '../services/logging/logger-base';
import { AuthBaseGuard } from './auth-base.guard';
import { SecurityServiceProvider } from './authentication/security-provider.service';
import { LaunchDarklyService } from '../services/launch-darkly.service';

@Injectable()
export class AuthGuard extends AuthBaseGuard implements CanActivate {
    constructor(
        securityServiceProviderService: SecurityServiceProvider,
        protected router: Router,
        protected logger: Logger,
        protected ldService: LaunchDarklyService
    ) {
        super(securityServiceProviderService, router, logger, ldService);
    }

    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
        return this.isUserAuthorized(route, state);
    }
}
