import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
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
    readonly inPageFeedbackUrl = {
        en: 'https://www.smartsurvey.co.uk/s/VideoHearings_Feedback/?pageurl=',
        cy: 'https://www.smartsurvey.co.uk/s/VideoHearings_Feedback/?pageurl=&language=cy',
        tl: 'https://www.smartsurvey.co.uk/s/VideoHearings_Feedback/?pageurl=&language=tl'
    };
    readonly exitSurveyUrl = {
        en: 'https://www.smartsurvey.co.uk/s/VideoHearings_ExitSurvey/?pageurl=',
        cy: 'https://www.smartsurvey.co.uk/s/VideoHearings_ExitSurvey/?pageurl=&language=cy',
        tl: 'https://www.smartsurvey.co.uk/s/VideoHearings_ExitSurvey/?pageurl=&language=tl'
    };
    @Input() isRepresentativeOrIndividual: boolean;
    status: ConferenceStatus;

    private subscriptions = new Subscription();

    constructor(private router: Router, private eventService: EventsService, private translateService: TranslateService) {
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
                this.updateFeedbackUrl();
            })
        );
        this.subscriptions.add(
            this.translateService.onLangChange.subscribe(() => {
                this.updateFeedbackUrl();
            }));
    }

    private getInPageFeedbackUrl() {
        this.subscriptions.add(
            this.router.events.pipe(filter(event => event instanceof NavigationEnd)).subscribe((event: NavigationEnd) => {
                this.pageUrl = '';
                this.updateFeedbackUrl();
            })
        );
    }

    updateFeedbackUrl() {
        if (this.status === ConferenceStatus.Closed && this.router.url.indexOf('waiting-room') > -1) {
            this.setFeedbackUrl(this.exitSurveyUrl[this.translateService.currentLang]);
        } else {
            this.setFeedbackUrl(this.inPageFeedbackUrl[this.translateService.currentLang]);
        }
    }

    setFeedbackUrl(feedbackUrl: string): void {
        this.pageUrl = feedbackUrl + this.router.url;
    }
}
