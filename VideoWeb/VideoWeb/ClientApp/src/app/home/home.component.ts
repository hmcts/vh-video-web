import { Component, OnDestroy, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { EventTypes, PublicEventsService } from 'angular-auth-oidc-client';
import { Subject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';
import { Logger } from '../services/logging/logger-base';
import { pageUrls } from '../shared/page-url.constants';

@Component({
    selector: 'app-home',
    templateUrl: './home.component.html'
})
export class HomeComponent implements OnInit, OnDestroy {
    previousPageUrl = '';
    private destroyedSubject$ = new Subject();

    constructor(private router: Router, private eventService: PublicEventsService, private logger: Logger) {
        this.router.events
            .pipe(
                filter(event => event instanceof NavigationEnd),
                takeUntil(this.destroyedSubject$)
            )
            .subscribe((event: NavigationEnd) => {
                this.previousPageUrl = event.urlAfterRedirects;
            });
    }
    ngOnDestroy(): void {
        this.destroyedSubject$.next();
        this.destroyedSubject$.complete();
    }

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
        if (this.previousPageUrl === `/${pageUrls.Home}`) {
            this.router.navigate([`/${pageUrls.Login}`]);
        }
    }
}
