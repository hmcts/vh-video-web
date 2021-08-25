import { AuthOptions, PublicConfiguration } from 'angular-auth-oidc-client';
import { Observable } from 'rxjs';

export interface ISecurityService {
    isAuthenticated$: Observable<boolean>;
    userData$: Observable<any>;
    configuration: PublicConfiguration;
    authorize(authOptions?: AuthOptions, token?: string): void;
    checkAuth(url?: string): Observable<boolean>;
    getToken(): string;
    logoffAndRevokeTokens(urlHandler?: (url: string) => any): Observable<any>;
}
