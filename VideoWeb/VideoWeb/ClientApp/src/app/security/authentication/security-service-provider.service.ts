import { Injectable } from '@angular/core';
import { OidcSecurityService, PublicConfiguration } from 'angular-auth-oidc-client';
import { AuthOptions } from 'angular-auth-oidc-client/lib/login/auth-options';
import { Observable } from 'rxjs';
import { SecurityConfigSetupService } from '../security-config-setup.service';
import { IdpProviders } from '../security-providers';

export interface ISecurityService {
    authorize(authOptions?: AuthOptions): void;
    checkAuth(url?: string): Observable<boolean>;
    getToken(): string;
    logoffAndRevokeTokens(urlHandler?: (url: string) => any): Observable<any>;
    isAuthenticated$(): Observable<boolean>;
    userData$(): Observable<any>;
    configuration(): PublicConfiguration;
}

@Injectable({
    providedIn: 'root'
})
export class SecurityServiceProviderService {
    constructor(private securityConfigSetupService: SecurityConfigSetupService, private oidcSecurityService: OidcSecurityService) {}

    getSecurityService(): ISecurityService {
        switch (this.securityConfigSetupService.getIdp()) {
            case IdpProviders.magicLink:
                return null;

            case IdpProviders.vhaad:
            case IdpProviders.ejud:
                return (this.oidcSecurityService as unknown) as ISecurityService;
        }
    }
}
