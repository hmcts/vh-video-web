import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { Logger } from 'src/app/services/logging/logger-base';
import { PageTrackerService } from 'src/app/services/page-tracker.service';
import { ErrorService } from 'src/app/services/error.service';
import { ConnectionStatusService } from 'src/app/services/connection-status.service';
import { ErrorMessage } from '../models/error-message';
import { TranslateService } from '@ngx-translate/core';

@Component({
    selector: 'app-error',
    templateUrl: './error.component.html'
})
export class ErrorComponent implements OnInit, OnDestroy {
    private readonly loggerPrefix = '[ErrorPage] -';
    subscription = new Subscription();

    private browserRefresh: boolean;

    errorMessageTitle: string;
    errorMessageBody: string;
    connectionError: boolean;
    showReconnect: boolean;
    attemptingReconnect: boolean;
    isExtensionOrFirewallIssue = false;
    hasLostInternet = false;

    constructor(
        private router: Router,
        private pageTracker: PageTrackerService,
        private logger: Logger,
        private errorService: ErrorService,
        private connectionStatusService: ConnectionStatusService,
        private translateService: TranslateService
    ) {
        this.browserRefresh = false;
        this.checkForRefresh();
    }

    get hasInternetConnection(): boolean {
        this.hasLostInternet = this.hasLostInternet || !this.connectionStatusService.status;
        return !this.hasLostInternet;
    }

    ngOnInit(): void {
        this.attemptingReconnect = false;
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
        const defaultBodyMessage = this.translateService.instant('error.default-body-message');
        const defaultTitle = this.translateService.instant('error.problem-with-connection');
        const dto = this.hasInternetConnection
            ? this.errorService.getErrorMessageFromStorage()
            : new ErrorMessage(defaultTitle, defaultBodyMessage, true);
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
        if (this.connectionStatusService.status) {
            const previousPage = this.pageTracker.getPreviousUrl();
            this.logger.debug(`${this.loggerPrefix} Internet connection detected. Navigating to previous page`, {
                returnUrl: previousPage
            });
            this.attemptingReconnect = false;
            this.router.navigate([previousPage]);
            this.errorService.userTriggeredReconnect(true);
        } else {
            this.attemptingReconnect = false;
            this.logger.debug(`${this.loggerPrefix} No internet connection detected.`);
            this.connectionStatusService.checkNow();
            this.errorService.userTriggeredReconnect(false);
        }
    }
}
