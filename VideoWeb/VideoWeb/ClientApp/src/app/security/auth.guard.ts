import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot } from '@angular/router';
import { Observable } from 'rxjs';
import { Logger } from '../services/logging/logger-base';
import { AuthBaseGuard } from './auth-base.guard';
import { SecurityServiceProvider } from './authentication/security-provider.service';

@Injectable()
export class AuthGuard extends AuthBaseGuard {
    constructor(
        securityServiceProviderService: SecurityServiceProvider,
        protected router: Router,
        protected logger: Logger
    ) {
        super(securityServiceProviderService, router, logger);
    }

    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
        return this.isUserAuthorized(route, state);
    }
}
