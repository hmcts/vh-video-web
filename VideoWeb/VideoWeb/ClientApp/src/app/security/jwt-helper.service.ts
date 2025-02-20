import { Injectable } from '@angular/core';
import { JwtHelperService as Auth0JwtHelperService } from '@auth0/angular-jwt';

@Injectable({
    providedIn: 'root'
})
export class JwtHelperService {
    constructor(private helper: Auth0JwtHelperService) {}

    decodeToken(token: string){
        return this.helper.decodeToken(token);
    }

    isTokenExpired(token: string): boolean {
        return this.helper.isTokenExpired(token);
    }
}
