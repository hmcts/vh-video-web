import { Injectable } from '@angular/core';
import { PublicConfiguration } from 'angular-auth-oidc-client';
import { AuthOptions } from 'angular-auth-oidc-client/lib/login/auth-options';
import { ReplaySubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { ApiClient } from 'src/app/services/clients/api-client';
import { DecodedJWT, JWTBody } from './models/decoded-jwt.model';
import { ISecurityService } from './security-service.interface';

export class MagicLinkJwtBody extends JWTBody {
    name: string;

    constructor(body: any) {
        super(body);
    }

    get preferred_username() {
        return this.name;
    }
}

@Injectable({
    providedIn: 'root'
})
export class MagicLinkSecurityService implements ISecurityService {
    private token: string;
    decodedToken: DecodedJWT<MagicLinkJwtBody>;
    private isAuthenticatedSubject = new ReplaySubject<boolean>(1);
    private userDataSubject = new ReplaySubject<any>(1);

    constructor(private apiClient: ApiClient) {}

    authorize(authOptions?: AuthOptions, token?: string): void {
        this.token = token;
        this.decodedToken = new DecodedJWT(token, body => new MagicLinkJwtBody(body));
        this.checkAuth().subscribe(authenticated => {
            this.isAuthenticatedSubject.next(authenticated);

            if (authenticated) this.userDataSubject.next(this.decodedToken?.body);
        });
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

        return this.apiClient.isMagicLinkParticipantAuthorised().pipe(toIsAuthorisedResult);
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

    isAuthenticated$(): Observable<boolean> {
        return this.isAuthenticatedSubject.asObservable();
    }

    userData$(): Observable<any> {
        return this.userDataSubject.asObservable();
    }

    configuration(): PublicConfiguration {
        return null;
    }
}
