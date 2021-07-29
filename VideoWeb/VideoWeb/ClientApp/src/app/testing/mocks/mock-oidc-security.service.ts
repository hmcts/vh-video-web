import { PublicConfiguration } from 'angular-auth-oidc-client';
import { AuthOptions } from 'angular-auth-oidc-client/lib/login/auth-options';
import { Observable, of, from } from 'rxjs';
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

    get userData$(): Observable<UserData> {
        return of(this.userData);
    }

    get isAuthenticated$(): Observable<boolean> {
        return from([false, this.authenticated]);
    }
    userData: UserData;
    authenticated: boolean;
    configuration = {
        configuration: {
            scope: 'openid profile offline_access',
            secureRoutes: ['.']
        }
    } as PublicConfiguration;
    authorize(authOptions?: AuthOptions, token?: string): void {
        throw new Error('Method not implemented.');
    }
    logoffAndRevokeTokens(urlHandler?: (url: string) => any): Observable<any> {
        throw new Error('Method not implemented.');
    }

    setAuthenticated(authenticated: boolean) {
        this.authenticated = authenticated;
    }
    setUserData(userData: UserData) {
        this.userData = userData;
    }

    getToken(): string {
        return 'MockToken';
    }

    checkAuth(url?: string): Observable<boolean> {
        return of(this.authenticated);
    }
}
