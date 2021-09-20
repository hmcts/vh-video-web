import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { EventTypes, PublicEventsService } from 'angular-auth-oidc-client';
import { filter } from 'rxjs/operators';
import { Logger } from '../services/logging/logger-base';
import { pageUrls } from '../shared/page-url.constants';

@Component({
    selector: 'app-home',
    templateUrl: './home.component.html'
})
export class HomeComponent implements OnInit {
    constructor(private router: Router, private eventService: PublicEventsService, private logger: Logger, private route: ActivatedRoute) {}

    ngOnInit() {
        this.eventService
            .registerForEvents()
            .pipe(
                filter(
                    notification =>
                        notification.type === EventTypes.UserDataChanged || notification.type === EventTypes.NewAuthorizationResult
                )
            )
            .subscribe(value => {
                if (!value.value?.isRenewProcess) {
                    this.logger.info('[HomeComponent] - First time logging', value);
                    this.router.navigate([`/${pageUrls.Navigator}`]);
                }
            });
        if (this.route.snapshot.queryParamMap.get('code') === null) {
            this.router.navigate([`/${pageUrls.Login}`]);
        }
    }
}
