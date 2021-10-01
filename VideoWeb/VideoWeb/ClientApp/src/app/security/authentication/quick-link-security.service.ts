import { Injectable } from '@angular/core';
import { AuthOptions, PublicConfiguration } from 'angular-auth-oidc-client';
import { ReplaySubject, Observable, EMPTY, BehaviorSubject } from 'rxjs';
import { map, take, tap } from 'rxjs/operators';
import { ApiClient } from 'src/app/services/clients/api-client';
import { SessionStorage } from 'src/app/services/session-storage';
import { JWTBody } from '../idp-selection/models/jwt-body.model';
import { JwtHelperService } from '../jwt-helper.service';
import { ISecurityService } from './security-service.interface';

export class QuickLinkJwtBody extends JWTBody {
    // tslint:disable-next-line: variable-name
    preferred_username: string;
    private exp: number;

    constructor(body: any) {
        super(body);
    }

    get expiry(): number {
        return this.exp;
    }
}

@Injectable({
    providedIn: 'root'
})
export class QuickLinkSecurityService implements ISecurityService {
    private loggerPrefix = '[QuickLinkSecurityService] -';
    private token: string;
    private tokenSessionStorageKey = 'QUICK_LINKS_JWT';
    private tokenSessionStorage: SessionStorage<string>;
    private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
    private userDataSubject = new ReplaySubject<any>(1);

    decodedTokenBody: QuickLinkJwtBody;

    constructor(private apiClient: ApiClient, private jwtHelper: JwtHelperService) {
        this.tokenSessionStorage = new SessionStorage<string>(this.tokenSessionStorageKey);
        this.token = this.tokenSessionStorage.get();
        if (this.isTokenValid(this.token)) {
            this.decodedTokenBody = this.decodeTokenBody(this.token);
            this.isAuthenticatedSubject.next(true);
        }
    }

    authorize(authOptions?: AuthOptions, token?: string): void {
        this.setToken(token);
        this.checkAuth().pipe(take(1)).subscribe();
    }

    private clearToken() {
        this.setToken(null);
    }

    private setToken(token: string | null) {
        if (token === null) {
            this.token = null;
            this.decodedTokenBody = null;
            this.tokenSessionStorage.clear();
            this.isAuthenticatedSubject.next(false);
        } else {
            this.token = token;
            this.decodedTokenBody = this.decodeTokenBody(this.token);
            this.tokenSessionStorage.set(token);
        }
    }

    checkAuth(): Observable<boolean> {
        const tokenIsAuthorisedResult = source =>
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
        return this.apiClient.isQuickLinkParticipantAuthorised().pipe(
            tokenIsAuthorisedResult,
            tap(authenticated => {
                this.isAuthenticatedSubject.next(authenticated);

                // TODO: Due to AppInsightsLoggerService provided in app.module injecting Logger causes a circular dependency. This should be refactored
                if (authenticated) {
                    console.debug(`${this.loggerPrefix} Check auth passed. User is authenticated.`);
                    this.userDataSubject.next(this.decodedTokenBody);
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
        this.clearToken();
        this.isAuthenticatedSubject.next(false);
        return EMPTY;
    }

    private isTokenValid(token: string): boolean {
        return !this.hasTokenExpired(token);
    }

    private hasTokenExpired(token: string): boolean {
        return this.jwtHelper.isTokenExpired(token);
    }

    private decodeTokenBody(token: string): QuickLinkJwtBody {
        return new QuickLinkJwtBody(this.jwtHelper.decodeToken(token));
    }

    get isAuthenticated$(): Observable<boolean> {
        return this.isAuthenticatedSubject.asObservable().pipe(
            map(isAuthenticated => {
                if (!isAuthenticated) {
                    return false;
                }
                const isValid = this.isTokenValid(this.token);
                if (!isValid) {
                    this.clearToken();
                }
                return isValid;
            })
        );
    }

    get userData$(): Observable<any> {
        return this.userDataSubject.asObservable();
    }

    get configuration(): PublicConfiguration {
        return null;
    }
}
