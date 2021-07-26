import { Injectable } from '@angular/core';
import { OidcSecurityService } from 'angular-auth-oidc-client';
import { SecurityConfigSetupService } from '../security-config-setup.service';
import { IdpProviders } from '../idp-providers';
import { MagicLinkSecurityService } from './magic-link-security.service';
import { ISecurityService } from './security-service.interface';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class SecurityServiceProviderService {
    private idpSubject: BehaviorSubject<IdpProviders>;
    private securityServiceSubject: BehaviorSubject<ISecurityService>;

    constructor(
        private securityConfigSetupService: SecurityConfigSetupService,
        private magicLinkSecurityService: MagicLinkSecurityService,
        private oidcSecurityService: OidcSecurityService
    ) {
        this.securityConfigSetupService.currentIdp$.subscribe(idp => {
            this.idpSubject.next(idp);
            this.securityServiceSubject.next(this.getSecurityService(idp));
        });

        this.idpSubject = new BehaviorSubject<IdpProviders>(this.securityConfigSetupService.getIdp());
        this.securityServiceSubject = new BehaviorSubject<ISecurityService>(this.getSecurityService());
    }

    getSecurityService(idp: IdpProviders = null): ISecurityService {
        switch (idp ?? this.securityConfigSetupService.getIdp()) {
            default:
                return null;

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

    get currentIdp$(): Observable<IdpProviders> {
        return this.idpSubject.asObservable();
    }
}
