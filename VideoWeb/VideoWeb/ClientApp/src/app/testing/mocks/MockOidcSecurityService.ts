import { Observable, of } from 'rxjs';
interface UserData {
    preferred_username?: string;
    name?: string;
    email?: string;
    email_verified?: false;
    given_name?: string;
    role?: string;
    amr?: string;
}

export class MockOidcSecurityService {
    userData: UserData;
    authenticated: boolean;

    setAuthenticated(authenticated: boolean) {
        this.authenticated = authenticated;
    }
    setUserData(userData: UserData) {
        this.userData = userData;
    }

    get userData$(): Observable<UserData> {
        return of(this.userData);
    }

    get isAuthenticated$(): Observable<boolean> {
        return of(this.authenticated);
    }

    getToken(): string {
        return 'MockToken';
    }

    checkAuth(url?: string): Observable<boolean> {
        return of(this.authenticated);
    }

    logoffAndRevokeTokens() {
        this.setAuthenticated(false);
        this.setUserData(null);
    }
}
