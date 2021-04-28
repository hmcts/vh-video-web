import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { pageUrls } from 'src/app/shared/page-url.constants';
import { OidcConfigSetupService } from '../oidc-config-setup.service';

@Component({
    selector: 'app-vh-sign-in',
    template: ``,
    styles: []
})
export class VhSignInComponent implements OnInit {
    constructor(private router: Router, private oidcConfigSetupService: OidcConfigSetupService) {}

    ngOnInit(): void {
        this.oidcConfigSetupService.setIdp('vhaad');
        this.router.navigate([`/${pageUrls.Login}`]);
    }
}
