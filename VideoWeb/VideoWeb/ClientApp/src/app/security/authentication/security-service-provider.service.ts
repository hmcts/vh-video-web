import { Injectable } from '@angular/core';
import { OidcSecurityService } from 'angular-auth-oidc-client';
import { SecurityConfigSetupService } from '../security-config-setup.service';
import { IdpProviders } from '../idp-providers';
import { MagicLinkSecurityService } from './magic-link-security.service';
import { ISecurityService } from './security-service.interface';
import { Observable, ReplaySubject } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class SecurityServiceProviderService {
    private securityServiceSubject = new ReplaySubject<ISecurityService>(1);

    constructor(
        private securityConfigSetupService: SecurityConfigSetupService,
        private magicLinkSecurityService: MagicLinkSecurityService,
        private oidcSecurityService: OidcSecurityService
    ) {
        this.securityConfigSetupService.currentIdp$.subscribe(() => {
            this.securityServiceSubject.next(this.getSecurityService());
        });
    }

    getSecurityService(): ISecurityService {
        switch (this.securityConfigSetupService.getIdp()) {
            case IdpProviders.magicLink:
                return this.magicLinkSecurityService;

            case IdpProviders.vhaad:
            case IdpProviders.ejud:
                return (this.oidcSecurityService as unknown) as ISecurityService;
        }
    }

    get currentSecurityService$(): Observable<ISecurityService> {
        return this.securityServiceSubject.asObservable();
    }
}
