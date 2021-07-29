import { Injectable } from '@angular/core';
import { SecurityConfigSetupService } from '../security-config-setup.service';
import { IdpProviders } from '../idp-providers';
import { MagicLinkSecurityService } from './magic-link-security.service';
import { ISecurityService } from './security-service.interface';
import { BehaviorSubject, Observable } from 'rxjs';
import { OidcSecurityService } from 'angular-auth-oidc-client';

@Injectable({
    providedIn: 'root'
})
export class SecurityServiceProvider {
    private idpSubject: BehaviorSubject<IdpProviders>;
    private securityServiceSubject: BehaviorSubject<ISecurityService>;

    constructor(
        private securityConfigSetupService: SecurityConfigSetupService,
        private magicLinkSecurityService: MagicLinkSecurityService,
        private oidcSecurityService: OidcSecurityService
    ) {
        this.idpSubject = new BehaviorSubject<IdpProviders>(this.securityConfigSetupService.getIdp());
        this.securityServiceSubject = new BehaviorSubject<ISecurityService>(this.getSecurityService());

        this.securityConfigSetupService.currentIdp$.subscribe(idp => {
            this.idpSubject.next(idp);
            this.securityServiceSubject.next(this.getSecurityService(idp));
        });
    }

    getSecurityService(idp: IdpProviders = null): ISecurityService {
        switch (idp ?? this.securityConfigSetupService.getIdp()) {
            default:
                return null;

            case IdpProviders.magicLink:
                return this.magicLinkSecurityService;

            case IdpProviders.vhaad:
            case IdpProviders.ejud:
                return this.oidcSecurityService;
        }
    }

    get currentSecurityService$(): Observable<ISecurityService> {
        return this.securityServiceSubject.asObservable();
    }

    get currentIdp$(): Observable<IdpProviders> {
        return this.idpSubject.asObservable();
    }
}
