import { Injectable } from '@angular/core';
import { PublicConfiguration } from 'angular-auth-oidc-client';
import { AuthOptions } from 'angular-auth-oidc-client/lib/login/auth-options';
import { ReplaySubject, Observable, BehaviorSubject, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { ApiClient } from 'src/app/services/clients/api-client';
import { SessionStorage } from 'src/app/services/session-storage';
import { DecodedJWT, JWTBody } from './models/decoded-jwt.model';
import { ISecurityService } from './security-service.interface';

export class MagicLinkJwtBody extends JWTBody {
    preferred_username: string;

    constructor(body: any) {
        super(body);
    }
}

@Injectable({
    providedIn: 'root'
})
export class MagicLinkSecurityService implements ISecurityService {
    private loggerPrefix = '[MagicLinkSecurityService] -';
    private token: string;
    private tokenSessionStorageKey = 'MAGIC_LINKS_JWT';
    private tokenSessionStorage: SessionStorage<string>;
    private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
    private userDataSubject = new ReplaySubject<any>(1);

    decodedToken: DecodedJWT<MagicLinkJwtBody>;

    constructor(private apiClient: ApiClient) {
        this.tokenSessionStorage = new SessionStorage<string>(this.tokenSessionStorageKey);
        this.token = this.tokenSessionStorage.get();
    }

    authorize(authOptions?: AuthOptions, token?: string): void {
        this.setToken(token);
        this.checkAuth().subscribe(() => {});
    }

    private clearToken() {
        this.setToken(null);
    }

    private setToken(token: string | null) {
        if (token === null) {
            this.token = null;
            this.decodedToken = null;
            this.tokenSessionStorage.clear();
        } else {
            this.token = token;
            this.decodedToken = new DecodedJWT(this.token, body => new MagicLinkJwtBody(body));
            this.tokenSessionStorage.set(token);
        }
    }

    checkAuth(): Observable<boolean> {
        const toIsAuthorisedResult = source =>
            new Observable<boolean>(subscriber => {
                return source.subscribe({
                    next() {
                        subscriber.next(true);
                    },
                    error() {
                        subscriber.next(false);
                    },
                    complete() {
                        subscriber.complete();
                    }
                });
            });

        return this.apiClient.isMagicLinkParticipantAuthorised().pipe(
            toIsAuthorisedResult,
            tap(authenticated => {
                this.isAuthenticatedSubject.next(authenticated);

                if (authenticated) {
                    console.debug(`${this.loggerPrefix} Check auth passed. User is authenticated.`);
                    this.userDataSubject.next(this.decodedToken?.body);
                } else {
                    console.warn(`${this.loggerPrefix} Check auth FAILED. User is NOT authenticated. Clearing token.`);
                    this.clearToken();
                }
            })
        );
    }

    getToken(): string {
        return this.token;
    }

    logoffAndRevokeTokens(): Observable<any> {
        return of(this.clearToken());
    }

    get isAuthenticated$(): Observable<boolean> {
        return this.isAuthenticatedSubject.asObservable();
    }

    get userData$(): Observable<any> {
        return this.userDataSubject.asObservable();
    }

    get configuration(): PublicConfiguration {
        return null;
    }
}
