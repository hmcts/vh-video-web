import { AuthOptions, LoginResponse, LogoutAuthOptions, OpenIdConfiguration } from 'angular-auth-oidc-client';
import { Observable } from 'rxjs';

export interface ISecurityService {
    isAuthenticated(configId: string): Observable<boolean>;
    getUserData(configId: string): Observable<any>;
    getConfiguration(configId: string): Observable<OpenIdConfiguration>;
    authorize(configId: string, authOptions?: AuthOptions, token?: string): void;
    checkAuth(url: string, configId?: string): Observable<LoginResponse>;
    getAccessToken(configId: string): Observable<string>;
    logoffAndRevokeTokens(configId: string, logoutAuthOptions?: LogoutAuthOptions): Observable<any>;
}
