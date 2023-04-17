import { Injectable } from '@angular/core';
import { AuthOptions, LoginResponse, OpenIdConfiguration, UserDataResult } from 'angular-auth-oidc-client';
import { ReplaySubject, Observable, EMPTY, BehaviorSubject, Subscription, of } from 'rxjs';
import { map, take, tap } from 'rxjs/operators';
import { ApiClient } from 'src/app/services/clients/api-client';
import { SessionStorage } from 'src/app/services/session-storage';
import { JWTBody } from '../idp-selection/models/jwt-body.model';
import { JwtHelperService } from '../jwt-helper.service';
import { ISecurityService } from './security-service.interface';
import { SecurityConfigSetupService } from '../security-config-setup.service';
import { Router } from '@angular/router';
import { pageUrls } from '../../shared/page-url.constants';
import { IdpProviders } from '../idp-providers';

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
    private checkAuthSubscription = new Subscription();

    decodedTokenBody: QuickLinkJwtBody;

    constructor(
        private apiClient: ApiClient,
        private jwtHelper: JwtHelperService,
        private securityConfigSetupService: SecurityConfigSetupService,
        private router: Router
    ) {
        this.tokenSessionStorage = new SessionStorage<string>(this.tokenSessionStorageKey);
        this.token = this.tokenSessionStorage.get();
        if (this.isTokenValid(this.token)) {
            this.decodedTokenBody = this.decodeTokenBody(this.token);
            this.isAuthenticatedSubject.next(true);
        }
    }

    authorize(configId?: string, authOptions?: AuthOptions, token?: string): void {
        this.setToken(token);
        this.checkAuthSubscription.add(this.checkAuth().pipe(take(1)).subscribe());
    }

    private clearToken() {
        this.setToken(null);
        this.checkAuthSubscription.unsubscribe();
        this.securityConfigSetupService.setIdp(IdpProviders.vhaad);
        this.router.navigate([`/${pageUrls.Logout}`]);
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

    checkAuth(): Observable<LoginResponse> {
        const tokenIsAuthorisedResult = source =>
            new Observable<LoginResponse>(subscriber => {
                return source.subscribe({
                    next() {
                        const result: LoginResponse = {
                            isAuthenticated: true,
                            accessToken: this.token,
                            configId: IdpProviders.quickLink,
                            userData: this.decodedTokenBody,
                            idToken: this.token
                        };
                        subscriber.next(result);
                    },
                    error() {
                        const result: LoginResponse = {
                            isAuthenticated: false,
                            accessToken: null,
                            configId: IdpProviders.quickLink,
                            userData: null,
                            idToken: null
                        };
                        subscriber.next(result);
                    },
                    complete() {
                        subscriber.complete();
                    }
                });
            });
        return this.apiClient.isQuickLinkParticipantAuthorised().pipe(
            tokenIsAuthorisedResult,
            tap(authenticated => {
                this.isAuthenticatedSubject.next(authenticated.isAuthenticated);

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

    getAccessToken(): Observable<string> {
        return of(this.token);
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

    // get isAuthenticated$(): Observable<AuthenticatedResult> {
    //     return this.isAuthenticatedSubject.asObservable().pipe(
    //         map(isAuthenticated => {
    //             if (!isAuthenticated) {
    //                 return { isAuthenticated: true, allConfigsAuthenticated: [] };
    //             }
    //             const isValid = this.isTokenValid(this.token);
    //             if (!isValid) {
    //                 this.clearToken();
    //             }
    //             return { isAuthenticated: isValid, allConfigsAuthenticated: [] };
    //         })
    //     );
    // }
    isAuthenticated(configId?: string): Observable<boolean> {
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

    getUserData(configId?: string): Observable<UserDataResult> {
        return this.userDataSubject.asObservable();
    }

    getConfiguration(configId?: string): Observable<OpenIdConfiguration> {
        return EMPTY;
    }
    // get configuration(): PublicConfiguration {
    //     return null;
    // }
}
