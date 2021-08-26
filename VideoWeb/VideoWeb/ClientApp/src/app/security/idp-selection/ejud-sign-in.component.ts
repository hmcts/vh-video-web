import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { pageUrls } from 'src/app/shared/page-url.constants';
import { SecurityConfigSetupService } from '../security-config-setup.service';
import { IdpProviders } from '../idp-providers';

@Component({
    selector: 'app-ejud-sign-in',
    template: ``,
    styles: []
})
export class EjudSignInComponent implements OnInit {
    constructor(private router: Router, private securityConfigSetupService: SecurityConfigSetupService) {}

    ngOnInit(): void {
        this.securityConfigSetupService.setIdp(IdpProviders.ejud);
        this.router.navigate([`/${pageUrls.Login}`]);
    }
}
