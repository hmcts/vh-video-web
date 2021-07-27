import { Injectable } from '@angular/core';
import { PublicConfiguration } from 'angular-auth-oidc-client';
import { AuthOptions } from 'angular-auth-oidc-client/lib/login/auth-options';
import { ReplaySubject, Observable } from 'rxjs';
import { take, tap } from 'rxjs/operators';
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
    private token: string;
    private tokenSessionStorageKey = 'MAGIC_LINKS_JWT';
    private tokenSessionStorage: SessionStorage<string>;
    private isAuthenticatedSubject = new ReplaySubject<boolean>(1);
    private userDataSubject = new ReplaySubject<any>(1);

    decodedToken: DecodedJWT<MagicLinkJwtBody>;

    constructor(private apiClient: ApiClient) {
        this.tokenSessionStorage = new SessionStorage<string>(this.tokenSessionStorageKey);
        this.token = this.tokenSessionStorage.get();
    }

    authorize(authOptions?: AuthOptions, token?: string): void {
        this.setToken(token);

        this.decodedToken = new DecodedJWT(this.token, body => new MagicLinkJwtBody(body));

        this.checkAuth().subscribe(authenticated => {
            this.isAuthenticatedSubject.next(authenticated);

            if (authenticated) {
                this.userDataSubject.next(this.decodedToken?.body);
            } else {
                this.clearToken();
            }
        });
    }

    private clearToken() {
        this.setToken(null);
    }

    private setToken(token: string | null) {
        if (token === null) {
            this.token = token;
            this.tokenSessionStorage.clear();
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

        return this.apiClient.isMagicLinkParticipantAuthorised().pipe(take(1), toIsAuthorisedResult);
    }

    getToken(): string {
        return this.token;
    }

    logoffAndRevokeTokens(): Observable<any> {
        return this.apiClient.revokeMagicLinkUserToken().pipe(
            tap(() => {
                this.isAuthenticatedSubject.next(false);
                this.userDataSubject.next(null);
            })
        );
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
