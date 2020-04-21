import { Component, OnDestroy, HostListener, OnInit } from '@angular/core';
import { Location } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { Subscription } from 'rxjs';
import { SessionStorage } from 'src/app/services/session-storage';
import { PageTrackerService } from 'src/app/services/page-tracker.service';

@Component({
    selector: 'app-error',
    templateUrl: './error.component.html'
})
export class ErrorComponent implements OnInit, OnDestroy {
    returnTimeout: NodeJS.Timer;
    subscription: Subscription;

    private readonly CALL_TIMEOUT = 30000;
    private browserRefresh: boolean;

    readonly ERROR_MESSAGE_KEY = 'vh.error.message';
    errorMessage: SessionStorage<string>;
    errorMessageText: string;
    connectionError: boolean;

    constructor(private router: Router, private location: Location, private pageTracker: PageTrackerService) {
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

    ngOnInit(): void {
        this.connectionError = this.getErrorMessage();
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

    private getErrorMessage(): boolean {
        this.errorMessage = new SessionStorage<string>(this.ERROR_MESSAGE_KEY);
        this.errorMessageText = this.errorMessage.get();
        return this.errorMessageText !== null;
    }

    reconnect(): void {
        const previousPage = this.pageTracker.getPreviousUrl();
        this.router.navigate([previousPage]);
    }
}
