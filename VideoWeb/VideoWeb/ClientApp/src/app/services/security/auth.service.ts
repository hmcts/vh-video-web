import { Injectable } from '@angular/core';
import { OidcSecurityService } from 'angular-auth-oidc-client';
import { ReplaySubject, Observable } from 'rxjs';
import { first, switchMap, tap } from 'rxjs/operators';

@Injectable()
export class AuthService {
    private checkAuthCompleted$ = new ReplaySubject(1);

    constructor(private oidcSecurityService: OidcSecurityService) { }

    public get isAuthenticated$(): Observable<boolean> {
        return this.checkAuthCompleted$.pipe(
            first(),
            switchMap((_) => this.oidcSecurityService.isAuthenticated$)
        );
    }

    public checkAuth(): Observable<boolean> {
        return this.oidcSecurityService.checkAuth().pipe(tap((_) => this.checkAuthCompleted$.next()));
    }

    public login(): void {
        this.oidcSecurityService.authorize();
    }

    public logout(): void {
        this.oidcSecurityService.logoffAndRevokeTokens();
    }
}
