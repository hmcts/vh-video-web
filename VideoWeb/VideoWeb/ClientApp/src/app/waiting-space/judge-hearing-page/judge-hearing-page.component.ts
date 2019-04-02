import { Component, OnInit, NgZone } from '@angular/core';
import { ConferenceResponse, ParticipantStatus, ConferenceStatus, UserRole } from 'src/app/services/clients/api-client';
import { Router, ActivatedRoute } from '@angular/router';
import { ServerSentEventsService } from 'src/app/services/server-sent-events.service';
import { VideoWebService } from 'src/app/services/video-web.service';
import { ParticipantStatusMessage } from 'src/app/services/models/participant-status-message';
import { SafeResourceUrl, DomSanitizer } from '@angular/platform-browser';

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
    private eventService: ServerSentEventsService,
    private ngZone: NgZone,
    public sanitizer: DomSanitizer
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
        () => {
          this.loadingData = false;
          this.router.navigate(['home']);
        });
  }

  sanitiseIframeUrl(): void {
    const judge = this.conference.participants.find(x => x.role === UserRole.Judge);
    const encodedDisplayName = encodeURIComponent(judge.tiled_display_name);
    const judgeUri = this.conference.judge_i_frame_uri + '?display_name=' + encodedDisplayName + '';
    console.log('Judge Uri: ' + judgeUri);
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

  requestFullScreen() {
    const judgeIframe = document.getElementById('judgeIframe') as HTMLIFrameElement;
    judgeIframe.requestFullscreen();
  }

  handleHearingStatusChange(status: ConferenceStatus) {
    this.conference.status = status;
    if (this.conference.status === ConferenceStatus.Closed) {
      this.selectedHearingUrl = '';
      this.router.navigate(['judge/dashboard']);
    }
  }
}
