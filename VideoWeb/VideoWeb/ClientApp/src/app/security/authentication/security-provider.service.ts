import { Injectable } from '@angular/core';
import { SecurityConfigSetupService } from '../security-config-setup.service';
import { IdpProviders } from '../idp-providers';
import { QuickLinkSecurityService } from './quick-link-security.service';
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
        private quickLinkSecurityService: QuickLinkSecurityService,
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
            case IdpProviders.quickLink:
                return this.quickLinkSecurityService;
            case IdpProviders.vhaad:
            case IdpProviders.ejud:
                return this.oidcSecurityService;
            default:
                return null;
        }
    }

    get currentSecurityService$(): Observable<ISecurityService> {
        return this.securityServiceSubject.asObservable();
    }

    get currentIdp$(): Observable<IdpProviders> {
        return this.idpSubject.asObservable();
    }
}
