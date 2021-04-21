import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { pageUrls } from '../shared/page-url.constants';
import { OidcSecurityService } from 'angular-auth-oidc-client';

@Component({
    selector: 'app-home',
    templateUrl: './home.component.html'
})
export class HomeComponent implements OnInit {
    constructor(
        private router: Router,private oidcSecurityService: OidcSecurityService
    ) {}

    ngOnInit() {
        this.oidcSecurityService.isAuthenticated$.subscribe((authenticated: boolean) => {
            if(authenticated){
                this.router.navigateByUrl(pageUrls.Navigator);
            }
        })
    }
}
