import { PublicConfiguration } from 'angular-auth-oidc-client';
import { AuthOptions } from 'angular-auth-oidc-client/lib/login/auth-options';
import { Observable } from 'rxjs';

export interface ISecurityService {
    authorize(authOptions?: AuthOptions, token?: string): void;
    checkAuth(url?: string): Observable<boolean>;
    getToken(): string;
    logoffAndRevokeTokens(urlHandler?: (url: string) => any): Observable<any>;
    isAuthenticated$: Observable<boolean>;
    userData$: Observable<any>;
    configuration: PublicConfiguration;
}
