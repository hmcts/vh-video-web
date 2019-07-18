import { Component, NgZone, OnInit } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { ConferenceResponse, ConferenceStatus, UserRole } from 'src/app/services/clients/api-client';
import { EventsService } from 'src/app/services/events.service';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { ErrorService } from 'src/app/services/error.service';
import { PageUrls } from 'src/app/shared/page-url.constants';
import { UserMediaService } from 'src/app/services/user-media.service';

@Component({
  selector: 'app-judge-hearing-page',
  templateUrl: './judge-hearing-page.component.html',
  styleUrls: ['./judge-hearing-page.component.css']
})
export class JudgeHearingPageComponent implements OnInit {

  loadingData: boolean;
  conference: ConferenceResponse;
  selectedHearingUrl: SafeResourceUrl;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private videoWebService: VideoWebService,
    private eventService: EventsService,
    private ngZone: NgZone,
    public sanitizer: DomSanitizer,
    private errorService: ErrorService,
    private userMediaService: UserMediaService
  ) {
    this.loadingData = true;
  }

  ngOnInit() {
    this.getConference();
  }

  getConference(): void {
    const conferenceId = this.route.snapshot.paramMap.get('conferenceId');
    this.videoWebService.getConferenceById(conferenceId)
      .subscribe((data: ConferenceResponse) => {
        this.loadingData = false;
        this.conference = data;
        this.sanitiseIframeUrl();
        this.setupSubscribers();
      },
        (error) => {
          this.loadingData = false;
          this.errorService.handleApiError(error);
        });
  }

  sanitiseIframeUrl(): void {
    const judge = this.conference.participants.find(x => x.role === UserRole.Judge);
    const encodedDisplayName = encodeURIComponent(judge.tiled_display_name);
    const cam = (this.userMediaService.getPreferredCamera()) ? this.userMediaService.getPreferredCamera().deviceId : '';
    const mic = (this.userMediaService.getPreferredMicrophone()) ? this.userMediaService.getPreferredMicrophone().deviceId : '';
    const judgeUri = `${this.conference.judge_i_frame_uri}?display_name=${encodedDisplayName}&cam=${cam}&mic=${mic}`;
    this.selectedHearingUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
      judgeUri
    );
  }

  private setupSubscribers() {
    this.eventService.start();

    this.eventService.getHearingStatusMessage().subscribe(message => {
      this.ngZone.run(() => {
        this.handleHearingStatusChange(<ConferenceStatus>message.status);
      });
    });
  }

  handleHearingStatusChange(status: ConferenceStatus) {
    if (status === ConferenceStatus.Closed) {
      this.selectedHearingUrl = '';
      this.router.navigate([PageUrls.JudgeHearingList]);
    }

    if (status === ConferenceStatus.Paused || status === ConferenceStatus.Suspended) {
      this.selectedHearingUrl = '';
      this.router.navigate([PageUrls.JudgeWaitingRoom, this.conference.id]);
    }
  }
}
