import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { EventsService } from 'src/app/services/events.service';
import { PageTrackerService } from 'src/app/services/page-tracker.service';
import { SessionStorage } from 'src/app/services/session-storage';
import { ErrorMessage } from '../models/error-message';

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
    errorMessage: SessionStorage<ErrorMessage>;
    errorMessageTitle: string;
    errorMessageBody: string;
    connectionError: boolean;
    showReconnect: boolean;

    constructor(private router: Router, private pageTracker: PageTrackerService, private eventsService: EventsService) {
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
        this.eventsService.stop();
        this.connectionError = this.getErrorMessage();
    }

    private goBack(): void {
        this.reconnect();
    }

    private startGoBackTimer(): void {
        this.returnTimeout = setTimeout(async () => {
            if (!this.connectionError) {
                this.goBack();
            }
        }, this.CALL_TIMEOUT);
    }

    @HostListener('window:beforeunload')
    ngOnDestroy(): void {
        clearTimeout(this.returnTimeout);
        this.subscription.unsubscribe();
    }

    private getErrorMessage(): boolean {
        const defaultBodyMessage = 'Please reconnect. Call us if you keep seeing this message.';
        this.errorMessage = new SessionStorage<ErrorMessage>(this.ERROR_MESSAGE_KEY);
        const dto = this.errorMessage.get();
        this.errorMessageTitle = dto?.title;
        this.errorMessageBody = dto?.body ? dto.body : defaultBodyMessage;
        this.showReconnect = dto?.showReconnect;
        return this.errorMessageTitle !== undefined;
    }

    reconnect(): void {
        const previousPage = this.pageTracker.getPreviousUrl();
        this.router.navigate([previousPage]);
    }
}
