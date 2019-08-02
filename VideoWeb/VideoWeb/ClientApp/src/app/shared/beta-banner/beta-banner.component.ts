import { Component, Input, OnInit } from '@angular/core';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import 'rxjs/add/operator/filter';
import { EventsService } from 'src/app/services/events.service';
import { ConferenceForUserResponse, ConferenceResponse, ConferenceStatus } from 'src/app/services/clients/api-client';
import { Logger } from 'src/app/services/logging/logger-base';
import { VideoWebService } from 'src/app/services/api/video-web.service';

@Component({
  selector: 'app-beta-banner',
  templateUrl: './beta-banner.component.html'
})
export class BetaBannerComponent implements OnInit {
  pageUrl: string;
  inPageFeedbackUrl = 'https://www.smartsurvey.co.uk/s/VideoHearings_Feedback/?pageurl=';
  exitSurveyUrl = 'https://www.smartsurvey.co.uk/s/VideoHearings_ExitSurvey/?pageurl=';
  conferences: ConferenceForUserResponse[];
  @Input() isRepresentativeOrIndividual: boolean;
  @Input() selectedConference: string;
  constructor(
    private router: Router,
    private eventService: EventsService,
    private logger: Logger,
    private videoWebService: VideoWebService,
    private route: ActivatedRoute) {
  }

  ngOnInit(): void {
    this.logger.debug('Loading the beta banner for representatives/individuals.');
    this.getInPageFeedbackUrl();
    this.setupSubscribers();
    console.log(this.selectedConference);
  }

  private getInPageFeedbackUrl() {
    this.logger.debug('retrieve in page feedback url.');
    this.router.events
      .filter(event => event instanceof NavigationEnd)
      .subscribe((event: NavigationEnd) => {
        this.pageUrl = this.inPageFeedbackUrl + this.router.url;
      });
  }

  private getExitSurveyFeedbackUrl() {
    this.logger.debug('retrieve exit survey url if the hearing has ended.');
    const conferenceId = this.route.snapshot.paramMap.get('conferenceId');
    this.videoWebService.getConferenceById(this.selectedConference)
      .subscribe((data: ConferenceResponse) => {
        if (data.status === ConferenceStatus.Closed) {
          this.pageUrl = '';
          this.pageUrl = this.exitSurveyUrl + this.router.url;
        }
      }, (error) => {
        this.logger.error(`There was an error getting a confernce ${conferenceId}`, error);
      });
  }

  private setupSubscribers() {
    this.eventService.start();
    this.eventService.getHearingStatusMessage().subscribe(message => {
      if (message.status === ConferenceStatus.Closed) {
        this.getExitSurveyFeedbackUrl();
      }
    });
  }
}
