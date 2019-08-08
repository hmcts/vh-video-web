import { Component, OnInit, Input } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { ConferenceStatus } from 'src/app/services/clients/api-client';
import { EventsService } from 'src/app/services/events.service';

@Component({
  selector: 'app-beta-banner',
  templateUrl: './beta-banner.component.html'
})
export class BetaBannerComponent implements OnInit {
  pageUrl: string;
  inPageFeedbackUrl = 'https://www.smartsurvey.co.uk/s/VideoHearings_Feedback/?pageurl=';
  exitSurveyUrl = 'https://www.smartsurvey.co.uk/s/VideoHearings_ExitSurvey/?pageurl=';
  @Input() isRepresentativeOrIndividual: boolean;
  status: ConferenceStatus;

  constructor(
    private router: Router,
    private eventService: EventsService) {
  }
  ngOnInit(): void {
    this.getInPageFeedbackUrl();
    this.setupSubscribers();
  }
  private setupSubscribers() {
    this.eventService.start();
    this.eventService.getHearingStatusMessage().subscribe(message => {
      this.status = message.status;

      this.pageUrl = '';
      if (message.status === ConferenceStatus.Closed) {
        this.pageUrl = this.exitSurveyUrl + this.router.url;
      } else {
        this.pageUrl = this.inPageFeedbackUrl + this.router.url;
      }
    });
  }
  private getInPageFeedbackUrl() {
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.pageUrl = '';
        if (this.status === ConferenceStatus.Closed && (this.router.url.indexOf('waiting-room') > -1)) {
          this.pageUrl = this.exitSurveyUrl + this.router.url;
        } else {
          this.pageUrl = this.inPageFeedbackUrl + this.router.url;
        }
      });
  }
}
