import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { Logger } from 'src/app/services/logging/logger-base';
import { PageTrackerService } from 'src/app/services/page-tracker.service';
import { ErrorService } from 'src/app/services/error.service';
import { ConnectionStatusService } from 'src/app/services/connection-status.service';
import { ErrorMessage } from '../models/error-message';
import { TranslateService } from '@ngx-translate/core';
import { vhContactDetails } from '../contact-information';

@Component({
    standalone: false,
    selector: 'app-error',
    templateUrl: './error.component.html'
})
export class ErrorComponent implements OnInit, OnDestroy {
    failedAttemptToReconnect = false;
    errorMessageTitle: string;
    errorMessageBody: string;
    connectionError: boolean;
    showReconnect: boolean;
    attemptingReconnect: boolean;
    isExtensionOrFirewallIssue = false;
    hasLostInternet = false;
    contactDetails = vhContactDetails;
    subscription = new Subscription();

    private readonly loggerPrefix = '[ErrorPage] -';
    private browserRefresh: boolean;

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

    get connectionStatus(): boolean {
        return this.connectionStatusService.status;
    }

    @HostListener('window:beforeunload')
    ngOnDestroy(): void {
        this.subscription.unsubscribe();
        this.attemptingReconnect = false;
    }

    ngOnInit(): void {
        this.attemptingReconnect = false;
        this.getErrorMessage();
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
            this.connectionStatusService.userTriggeredReconnect();
        } else {
            this.failedAttemptToReconnect = true;
            this.attemptingReconnect = false;
            this.logger.debug(`${this.loggerPrefix} No internet connection detected.`);
            this.connectionStatusService.userTriggeredReconnect();
            this.connectionStatusService.checkNow();
        }
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
}
