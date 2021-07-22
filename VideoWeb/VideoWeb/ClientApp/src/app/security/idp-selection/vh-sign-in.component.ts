import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { pageUrls } from 'src/app/shared/page-url.constants';
import { SecurityConfigSetupService } from '../security-config-setup.service';
import { IdpProviders } from '../security-providers';

@Component({
    selector: 'app-vh-sign-in',
    template: ``,
    styles: []
})
export class VhSignInComponent implements OnInit {
    constructor(private router: Router, private securityConfigSetupService: SecurityConfigSetupService) {}

    ngOnInit(): void {
        this.securityConfigSetupService.setIdp(IdpProviders.vhaad);
        this.router.navigate([`/${pageUrls.Login}`]);
    }
}
