import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { pageUrls } from 'src/app/shared/page-url.constants';
import { IdpProviders } from '../idp-providers';
import { SecurityConfigSetupService } from '../security-config-setup.service';

@Component({
    selector: 'app-dom1-sign-in',
    template: ''
})
export class Dom1SignInComponent implements OnInit {
    constructor(
        private router: Router,
        private securityConfigSetupService: SecurityConfigSetupService
    ) {}

    ngOnInit(): void {
        this.securityConfigSetupService.setIdp(IdpProviders.dom1);
        this.router.navigate([`/${pageUrls.Login}`]);
    }
}
