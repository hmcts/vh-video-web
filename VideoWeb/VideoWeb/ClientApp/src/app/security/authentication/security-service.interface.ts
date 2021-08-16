import { PublicConfiguration } from 'angular-auth-oidc-client';
import { AuthOptions } from 'angular-auth-oidc-client/lib/login/auth-options';
import { Observable } from 'rxjs';

export interface ISecurityService {
    isAuthenticated$: Observable<boolean>;
    userData$: Observable<any>;
    configuration: PublicConfiguration;
    authorize(authOptions?: AuthOptions, token?: string): void;
    checkIsAuthenticated(url?: string): Observable<boolean>;
    getToken(): string;
    logoffAndRevokeTokens(urlHandler?: (url: string) => any): Observable<any>;
}
