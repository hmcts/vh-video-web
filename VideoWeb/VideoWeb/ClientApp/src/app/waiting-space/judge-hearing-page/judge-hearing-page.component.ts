import {Component, NgZone, OnInit} from '@angular/core';
import {DomSanitizer, SafeResourceUrl} from '@angular/platform-browser';
import {ActivatedRoute, Router} from '@angular/router';
import {ConferenceResponse, ConferenceStatus, UserRole} from 'src/app/services/clients/api-client';
import {EventsService} from 'src/app/services/events.service';
import {VideoWebService} from 'src/app/services/api/video-web.service';
import {ErrorService} from 'src/app/services/error.service';
import {PageUrls} from 'src/app/shared/page-url.constants';
import {UserMediaService} from 'src/app/services/user-media.service';
import {Logger} from 'src/app/services/logging/logger-base';

@Component({
  selector: 'app-judge-hearing-page',
  templateUrl: './judge-hearing-page.component.html',
  styleUrls: ['./judge-hearing-page.component.css']
})
export class JudgeHearingPageComponent implements OnInit {

  loadingData: boolean;
  conference: ConferenceResponse;
  selectedHearingUrl: SafeResourceUrl;
  allowPermissions: string;
  judgeUri: string;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private videoWebService: VideoWebService,
    private eventService: EventsService,
    private ngZone: NgZone,
    public sanitizer: DomSanitizer,
    private errorService: ErrorService,
    private userMediaService: UserMediaService,
    private logger: Logger
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
          if (!this.errorService.returnHomeIfUnauthorised(error)) {
            this.errorService.handleApiError(error);
          }
        });
  }

  async sanitiseIframeUrl(): Promise<void> {
    const judge = this.conference.participants.find(x => x.role === UserRole.Judge);
    const encodedDisplayName = encodeURIComponent(judge.tiled_display_name);

    const preferredCam = await this.userMediaService.getPreferredCamera();
    const preferredMic = await this.userMediaService.getPreferredMicrophone();

    let cam = '';
    let mic = (preferredMic) ? preferredMic.deviceId : '';

    if (preferredCam) {
      this.logger.info(`judge using camera ${preferredCam.label}`);
      cam = encodeURI(preferredCam.label);
    }

    if (preferredMic) {
      this.logger.info(`judge using microphone ${preferredMic.label}`);
      mic = encodeURI(preferredMic.label);
    }

    const iframeOrigin = new URL(this.conference.judge_i_frame_uri).origin;
    this.allowPermissions = `microphone ${iframeOrigin}; camera ${iframeOrigin};`;

    this.judgeUri = `${this.conference.judge_i_frame_uri}?display_name=${encodedDisplayName}&cam=${cam}&mic=${mic}`;
    this.selectedHearingUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
      this.judgeUri
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
    const judge = this.conference.participants.find(x => x.role === UserRole.Judge);
    const properties = {
      conferenceId: this.conference.id,
      user: judge.id
    };

    if (status === ConferenceStatus.Closed) {
      this.selectedHearingUrl = '';
      this.logger.event(`Conference closed, navigating back to hearing list`, properties);
      this.router.navigate([PageUrls.JudgeHearingList]);
    }

    if (status === ConferenceStatus.Paused || status === ConferenceStatus.Suspended) {
      this.selectedHearingUrl = '';
      this.logger.event(`Conference closed, navigating back to waiting room`, properties);
      this.router.navigate([PageUrls.JudgeWaitingRoom, this.conference.id]);
    }
  }

  judgeURLChanged() {
    const iFrameElem = <HTMLIFrameElement>document.getElementById('judgeIframe');
    const src = iFrameElem.src;
    if (src && src !== this.judgeUri) {
      this.logger.warn(`Uri ${src} is not recogised`);
      this.router.navigate([PageUrls.JudgeHearingList]);
    }
  }
}
