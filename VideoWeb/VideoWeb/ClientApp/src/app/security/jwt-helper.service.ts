import { Injectable } from '@angular/core';
import { JwtHelperService as Auth0JwtHelperService } from '@auth0/angular-jwt';

@Injectable({
    providedIn: 'root'
})
export class JwtHelperService {
    private helper: Auth0JwtHelperService = new Auth0JwtHelperService();

    decodeToken<T = any>(token: string): T {
        return this.helper.decodeToken(token);
    }

    isTokenExpired(token: string): boolean {
        return this.helper.isTokenExpired(token);
    }
}
