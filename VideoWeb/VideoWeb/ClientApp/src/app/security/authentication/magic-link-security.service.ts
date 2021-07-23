import { Injectable } from '@angular/core';
import { PublicConfiguration } from 'angular-auth-oidc-client';
import { AuthOptions } from 'angular-auth-oidc-client/lib/login/auth-options';
import { Observable } from 'rxjs';
import { ISecurityService } from './security-service.interface';

@Injectable({
    providedIn: 'root'
})
export class MagicLinkSecurityService implements ISecurityService {
    private token: string;

    constructor() {}

    authorize(authOptions?: AuthOptions): void {
        throw new Error('Method not supported.');
    }

    checkAuth(url?: string): Observable<boolean> {
        throw new Error('Method not implemented.');
    }

    getToken(): string {
        return this.token;
    }

    setToken(token: any) {
        this.token = token as string;
    }

    logoffAndRevokeTokens(urlHandler?: (url: string) => any): Observable<any> {
        throw new Error('Method not implemented.');
    }

    isAuthenticated$(): Observable<boolean> {
        throw new Error('Method not implemented.');
    }

    userData$(): Observable<any> {
        throw new Error('Method not implemented.');
    }

    configuration(): PublicConfiguration {
        throw new Error('Method not implemented.');
    }
}
