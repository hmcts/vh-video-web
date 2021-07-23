import { PublicConfiguration } from 'angular-auth-oidc-client';
import { AuthOptions } from 'angular-auth-oidc-client/lib/login/auth-options';
import { Observable } from 'rxjs';

export interface ISecurityService {
    authorize(authOptions?: AuthOptions): void;
    checkAuth(url?: string): Observable<boolean>;
    getToken(): string;
    setToken(token: any);
    logoffAndRevokeTokens(urlHandler?: (url: string) => any): Observable<any>;
    isAuthenticated$(): Observable<boolean>;
    userData$(): Observable<any>;
    configuration(): PublicConfiguration;
}
