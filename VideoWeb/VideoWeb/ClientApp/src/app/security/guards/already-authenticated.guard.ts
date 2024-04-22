import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { take, tap, map, timeout } from 'rxjs/operators';
import { pageUrls } from 'src/app/shared/page-url.constants';
import { SecurityServiceProvider } from '../authentication/security-provider.service';

@Injectable({
    providedIn: 'root'
})
export class AlreadyAuthenticatedGuard  {
    constructor(private securityServiceProvider: SecurityServiceProvider, private router: Router) {}

    canActivate(): Observable<boolean> {
        const securityService = this.securityServiceProvider.getSecurityService();
        const currentIdp = this.securityServiceProvider.currentIdp;
        return securityService.isAuthenticated(currentIdp).pipe(
            timeout(30000),
            take(1),
            tap(authenticated => {
                if (authenticated) {
                    this.router.navigate([pageUrls.Logout]);
                }
            }),
            map(authenticated => !authenticated)
        );
    }
}
