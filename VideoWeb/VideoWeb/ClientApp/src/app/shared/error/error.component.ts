import { Component, OnDestroy, HostListener } from '@angular/core';
import { Location } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-error',
    templateUrl: './error.component.html'
})
export class ErrorComponent implements OnDestroy {
    returnTimeout: NodeJS.Timer;
    subscription: Subscription;

    private readonly CALL_TIMEOUT = 30000;
    private browserRefresh: boolean;

    constructor(private router: Router, private location: Location) {
        this.browserRefresh = false;
        this.subscription = this.router.events.subscribe(event => {
            if (event instanceof NavigationEnd) {
                this.browserRefresh = event.id === 1 && event.url === event.urlAfterRedirects;
            }

            if (this.browserRefresh) {
                this.goBack();
            } else {
                this.startGoBackTimer();
            }
        });
    }

    private goBack(): void {
        this.location.back();
    }

    private startGoBackTimer(): void {
        this.returnTimeout = setTimeout(async () => {
            this.goBack();
        }, this.CALL_TIMEOUT);
    }

    @HostListener('window:beforeunload')
    ngOnDestroy(): void {
        clearTimeout(this.returnTimeout);
        this.subscription.unsubscribe();
    }
}
