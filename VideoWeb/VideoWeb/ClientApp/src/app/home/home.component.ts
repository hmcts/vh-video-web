import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { EventTypes, OidcSecurityService, PublicEventsService } from 'angular-auth-oidc-client';
import { filter } from 'rxjs/operators';
import { pageUrls } from '../shared/page-url.constants';

@Component({
    selector: 'app-home',
    templateUrl: './home.component.html'
})
export class HomeComponent implements OnInit {
    oidcSecurityService: OidcSecurityService;
    constructor(private router: Router, private eventService: PublicEventsService) {}

    ngOnInit() {
        this.eventService
            .registerForEvents()
            .pipe(
                filter(
                    notification =>
                        notification.type === EventTypes.UserDataChanged || notification.type === EventTypes.NewAuthorizationResult
                )
            )
            .subscribe(() => this.router.navigate([`/${pageUrls.Navigator}`]));
    }
}
