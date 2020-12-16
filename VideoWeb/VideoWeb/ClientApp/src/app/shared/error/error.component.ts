import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { ProfileService } from 'src/app/services/api/profile.service';
import { EventsService } from 'src/app/services/events.service';
import { Logger } from 'src/app/services/logging/logger-base';
import { PageTrackerService } from 'src/app/services/page-tracker.service';
import { ErrorService } from 'src/app/services/error.service';

@Component({
    selector: 'app-error',
    templateUrl: './error.component.html'
})
export class ErrorComponent implements OnInit, OnDestroy {
    private readonly loggerPrefix = '[ErrorPage] -';
    returnTimeout: NodeJS.Timer;
    subscription = new Subscription();

    private readonly CALL_TIMEOUT = 30000;
    private browserRefresh: boolean;

    errorMessageTitle: string;
    errorMessageBody: string;
    connectionError: boolean;
    showReconnect: boolean;
    attemptingReconnect: boolean;
    isExtensionOrFirewallIssue = false;
    isOnline: boolean;

    constructor(
        private router: Router,
        private pageTracker: PageTrackerService,
        private eventsService: EventsService,
        private logger: Logger,
        private errorService: ErrorService,
        protected profileService: ProfileService
    ) {
        this.checkIntenetConnection();
        this.browserRefresh = false;
        this.checkForRefresh();
    }

    private async checkIntenetConnection(): Promise<void> {
        try {
            await this.profileService.getUserProfile();
            this.isOnline = true;
        } catch (err) {
            this.isOnline = false;
        }
    }
    get hasInternetConnection(): boolean {
        return this.isOnline;
    }

    ngOnInit(): void {
        this.attemptingReconnect = false;
        this.eventsService.stop();
        this.getErrorMessage();
    }

    private checkForRefresh() {
        this.subscription.add(
            this.router.events.subscribe(event => {
                if (event instanceof NavigationEnd) {
                    this.browserRefresh = event.id === 1 && event.url === event.urlAfterRedirects;

                    if (this.browserRefresh) {
                        this.logger.debug(`${this.loggerPrefix} Page refresh detected. Navigating back.`);
                        this.reconnect();
                    } else {
                        this.logger.debug(`${this.loggerPrefix} No Page refresh detected. Starting timer.`);
                        this.startGoBackTimer();
                    }
                }
            })
        );
    }

    private startGoBackTimer(): void {
        this.logger.debug(`${this.loggerPrefix} Starting timer to automatically navigate to previous page`);
        this.stopGoBacktimer();
        this.returnTimeout = setTimeout(async () => {
            this.executeGoBackTimeout();
        }, this.CALL_TIMEOUT);
    }

    private stopGoBacktimer() {
        if (this.returnTimeout) {
            this.logger.debug(`${this.loggerPrefix} Stopping and clearing current return timeout`);
            clearTimeout(this.returnTimeout);
            this.returnTimeout = undefined;
        }
    }

    executeGoBackTimeout() {
        this.logger.debug(`${this.loggerPrefix} Attempting execute automatic go back`);
        this.stopGoBacktimer();
        this.reconnect();
    }

    @HostListener('window:beforeunload')
    ngOnDestroy(): void {
        this.stopGoBacktimer();
        this.subscription.unsubscribe();
        this.attemptingReconnect = false;
    }

    private getErrorMessage(): void {
        const defaultBodyMessage = 'Please reconnect. Call us if you keep seeing this message.';
        const dto = this.errorService.getErrorMessageFromStorage();
        this.errorMessageTitle = dto?.title;
        this.isExtensionOrFirewallIssue = this.errorMessageTitle === 'FirewallProblem';
        this.errorMessageBody = dto?.body ? dto.body : defaultBodyMessage;
        this.showReconnect = dto?.showReconnect;
        this.connectionError = this.errorMessageTitle !== undefined;
    }

    reconnect(): void {
        if (this.attemptingReconnect) {
            this.logger.debug(`${this.loggerPrefix} Reconnection already in progress`);
            return;
        }
        this.attemptingReconnect = true;
        this.checkIntenetConnection();
        if (this.hasInternetConnection) {
            const previousPage = this.pageTracker.getPreviousUrl();
            this.logger.debug(`${this.loggerPrefix} Internet connection detected. Navigating to previous page`, {
                returnUrl: previousPage
            });
            this.attemptingReconnect = false;
            this.router.navigate([previousPage]);
        } else {
            this.attemptingReconnect = false;
            this.logger.debug(`${this.loggerPrefix} No internet connection detected. Restarting timer`);
            this.startGoBackTimer();
        }
    }
}
