import { Component, OnInit } from '@angular/core';
import { SecurityServiceProvider } from '../security/authentication/security-provider.service';
import { combineLatest } from 'rxjs';
import { ISecurityService } from '../security/authentication/security-service.interface';
import { IdpProviders } from '../security/idp-providers';
import { Router } from '@angular/router';
import { pageUrls } from '../shared/page-url.constants';

@Component({
    selector: 'app-home',
    templateUrl: './home.component.html'
})
export class HomeComponent implements OnInit {
    securityService: ISecurityService;
    currentIdp: IdpProviders;

    constructor(
        private securityServiceProviderService: SecurityServiceProvider,
        private router: Router
    ) {
        combineLatest([
            this.securityServiceProviderService.currentSecurityService$,
            this.securityServiceProviderService.currentIdp$
        ]).subscribe(([service, idp]) => {
            this.securityService = service;
            this.currentIdp = idp;
        });
    }

    ngOnInit() {
        this.securityService.isAuthenticated(this.currentIdp).subscribe(isAuthenticated => {
            if (isAuthenticated) {
                this.router.navigate([`/${pageUrls.Navigator}`]);
            }
        });
    }
}
