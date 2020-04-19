import { Component, OnDestroy, HostListener } from '@angular/core';
import { Location } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { Subscription } from 'rxjs';
import { SessionStorage } from 'src/app/services/session-storage';

@Component({
    selector: 'app-error',
    templateUrl: './error.component.html'
})
export class ErrorComponent implements OnDestroy {
    returnTimeout: NodeJS.Timer;
    subscription: Subscription;

    private readonly CALL_TIMEOUT = 30000;
    private browserRefresh: boolean;

    readonly ERROR_MESSAGE_KEY = 'vh.error.message';
    errorMessage: SessionStorage<string>;
    errorMessageText: string;
    connectionError: boolean;

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
        this.errorMessage = new SessionStorage<string>(this.ERROR_MESSAGE_KEY);
        this.errorMessageText = this.errorMessage.get();
        this.connectionError = this.errorMessageText !== null;
    }

    private goBack(): void {
        this.location.back();
    }

    private startGoBackTimer(): void {
        this.returnTimeout = setTimeout(async () => {
            this.goBack();
        }, this.CALL_TIMEOUT);
    }

    reconnect(): void {
        this.location.back();
    }

    @HostListener('window:beforeunload')
    ngOnDestroy(): void {
        clearTimeout(this.returnTimeout);
        this.subscription.unsubscribe();
    }
}
