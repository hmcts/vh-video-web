import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { EventsService } from 'src/app/services/events.service';
import { Logger } from 'src/app/services/logging/logger-base';
import { PageTrackerService } from 'src/app/services/page-tracker.service';
import { ErrorService } from 'src/app/services/error.service';
import { ConnectionStatusService } from 'src/app/services/connection-status.service';

@Component({
    selector: 'app-error',
    templateUrl: './error.component.html'
})
export class ErrorComponent implements OnInit, OnDestroy {
    private readonly loggerPrefix = '[ErrorPage] -';
    returnTimeout: NodeJS.Timer;
    subscription = new Subscription();

    private browserRefresh: boolean;

    errorMessageTitle: string;
    errorMessageBody: string;
    connectionError: boolean;
    showReconnect: boolean;
    attemptingReconnect: boolean;
    isExtensionOrFirewallIssue = false;

    constructor(
        private router: Router,
        private pageTracker: PageTrackerService,
        private eventsService: EventsService,
        private logger: Logger,
        private errorService: ErrorService,
        private connectionStatusService: ConnectionStatusService
    ) {
        this.browserRefresh = false;
        this.checkForRefresh();
    }

    get hasInternetConnection(): boolean {
        return this.connectionStatusService.status;
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
                        this.logger.debug(`${this.loggerPrefix} No Page refresh detected.`);
                    }
                }
            })
        );
    }

    @HostListener('window:beforeunload')
    ngOnDestroy(): void {
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
        if (this.hasInternetConnection) {
            const previousPage = this.pageTracker.getPreviousUrl();
            this.logger.debug(`${this.loggerPrefix} Internet connection detected. Navigating to previous page`, {
                returnUrl: previousPage
            });
            this.attemptingReconnect = false;
            this.router.navigate([previousPage]);
        } else {
            this.attemptingReconnect = false;
            this.logger.debug(`${this.loggerPrefix} No internet connection detected.`);
        }
    }
}
