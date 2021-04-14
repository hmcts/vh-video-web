import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from '@angular/router';
import { OidcSecurityService } from 'angular-auth-oidc-client';
import { Observable } from 'rxjs';
import { map, skip } from 'rxjs/operators';
import { pageUrls } from '../shared/page-url.constants';

@Injectable()
export class AuthGuard implements CanActivate {
    constructor(private oidcSecurityService: OidcSecurityService, private router: Router) {}

    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
        return this.oidcSecurityService.isAuthenticated$.pipe(
            skip(1),
            map((isAuthorized: boolean) => {
                console.log('AuthorizationGuard, canActivate isAuthorized: ' + isAuthorized);

                if (!isAuthorized) {
                    this.router.navigate([`/${pageUrls.IdpSelection}`]);
                    return false;
                }

                return true;
            })
        );
    }
}
