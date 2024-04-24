import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { take, tap, map, timeout } from 'rxjs/operators';
import { pageUrls } from 'src/app/shared/page-url.constants';
import { SecurityServiceProvider } from '../authentication/security-provider.service';
import { IdpProviders } from '../idp-providers';

@Injectable({ providedIn: 'root' })
export class AlreadyAuthenticatedDom1Guard {
    currentIdp: IdpProviders = IdpProviders.dom1;
    constructor(
        private securityServiceProvider: SecurityServiceProvider,
        private router: Router
    ) {}

    canActivate(): Observable<boolean> {
        return this.securityServiceProvider
            .getSecurityService(this.currentIdp)
            .isAuthenticated(this.currentIdp)
            .pipe(
                timeout(30000),
                take(1),
                tap(authenticated => {
                    if (authenticated) {
                        this.router.navigate([pageUrls.Home]);
                    }
                }),
                map(authenticated => !authenticated)
            );
    }
}
