import { AuthOptions, LoginResponse, LogoutAuthOptions, OpenIdConfiguration } from 'angular-auth-oidc-client';
import { Observable, of } from 'rxjs';
import { ISecurityService } from 'src/app/security/authentication/security-service.interface';
interface UserData {
    preferred_username?: string;
    name?: string;
    email?: string;
    email_verified?: false;
    given_name?: string;
    role?: string;
    amr?: string;
}

export class MockOidcSecurityService implements ISecurityService {
    userData: UserData;
    authenticated: boolean;
    configuration = {
        configuration: {
            scope: 'openid profile offline_access',
            secureRoutes: ['.']
        }
    } as OpenIdConfiguration;

    isAuthenticated(configId: string): Observable<boolean> {
        return of(this.authenticated);
    }
    getUserData(configId: string): Observable<any> {
        return of(this.userData);
    }
    getConfiguration(configId: string): Observable<OpenIdConfiguration> {
        return of(this.configuration);
    }
    authorize(configId: string, authOptions?: AuthOptions, token?: string): void {
        throw new Error('Method not implemented.');
    }
    checkAuth(url: string, configId?: string): Observable<LoginResponse> {
        return of({ isAuthenticated: this.authenticated } as LoginResponse);
    }

    getAccessToken(configId: string): Observable<string> {
        return of('MockToken');
    }
    logoffAndRevokeTokens(configId: string, logoutAuthOptions?: LogoutAuthOptions): Observable<any> {
        throw new Error('Method not implemented.');
    }

    setAuthenticated(authenticated: boolean) {
        this.authenticated = authenticated;
    }
    setUserData(userData: UserData) {
        this.userData = userData;
    }
}
