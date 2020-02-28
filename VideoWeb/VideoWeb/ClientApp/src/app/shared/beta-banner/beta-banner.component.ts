import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { ConferenceStatus } from 'src/app/services/clients/api-client';
import { EventsService } from 'src/app/services/events.service';

@Component({
    selector: 'app-beta-banner',
    templateUrl: './beta-banner.component.html'
})
export class BetaBannerComponent implements OnInit, OnDestroy {
    pageUrl: string;
    readonly inPageFeedbackUrl = 'https://www.smartsurvey.co.uk/s/VideoHearings_Feedback/?pageurl=';
    readonly exitSurveyUrl = 'https://www.smartsurvey.co.uk/s/VideoHearings_ExitSurvey/?pageurl=';
    @Input() isRepresentativeOrIndividual: boolean;
    status: ConferenceStatus;

    private subscriptions = new Subscription();

    constructor(private router: Router, private eventService: EventsService) {
        this.pageUrl = '';
    }
    ngOnInit(): void {
        this.getInPageFeedbackUrl();
        this.setupSubscribers();
    }

    ngOnDestroy(): void {
        this.subscriptions.unsubscribe();
    }

    private setupSubscribers() {
        this.subscriptions.add(
            this.eventService.getHearingStatusMessage().subscribe(message => {
                this.status = message.status;
                if (message.status === ConferenceStatus.Closed) {
                    this.updateFeedbackUrl(this.exitSurveyUrl);
                } else {
                    this.updateFeedbackUrl(this.inPageFeedbackUrl);
                }
            })
        );
        this.eventService.start();
    }

    private getInPageFeedbackUrl() {
        this.router.events.pipe(filter(event => event instanceof NavigationEnd)).subscribe((event: NavigationEnd) => {
            this.pageUrl = '';
            if (this.status === ConferenceStatus.Closed && this.router.url.indexOf('waiting-room') > -1) {
                this.updateFeedbackUrl(this.exitSurveyUrl);
            } else {
                this.updateFeedbackUrl(this.inPageFeedbackUrl);
            }
        });
    }

    updateFeedbackUrl(feedbackUrl: string): void {
        this.pageUrl = feedbackUrl + this.router.url;
    }
}
