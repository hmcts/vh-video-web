import { Injectable } from '@angular/core';
import { OidcSecurityService } from 'angular-auth-oidc-client';
import { SecurityConfigSetupService } from '../security-config-setup.service';
import { IdpProviders } from '../idp-providers';
import { MagicLinkSecurityService } from './magic-link-security.service';
import { ISecurityService } from './security-service.interface';

@Injectable({
    providedIn: 'root'
})
export class SecurityServiceProviderService {
    constructor(
        private securityConfigSetupService: SecurityConfigSetupService,
        private magicLinkSecurityService: MagicLinkSecurityService,
        private oidcSecurityService: OidcSecurityService
    ) {}

    getSecurityService(): ISecurityService {
        switch (this.securityConfigSetupService.getIdp()) {
            case IdpProviders.magicLink:
                return this.magicLinkSecurityService;

            case IdpProviders.vhaad:
            case IdpProviders.ejud:
                return (this.oidcSecurityService as unknown) as ISecurityService;
        }
    }
}
