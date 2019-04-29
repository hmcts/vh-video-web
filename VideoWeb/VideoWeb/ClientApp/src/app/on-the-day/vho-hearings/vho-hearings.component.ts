import { Component, HostListener, NgZone, OnInit } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { SnotifyPosition, SnotifyService } from 'ng-snotify';
import {
  ConferenceForUserResponse, ConferenceResponse, ConferenceStatus, ConsultationAnswer, TaskResponse
} from 'src/app/services/clients/api-client';
import { ConsultationMessage } from 'src/app/services/models/consultation-message';
import { HelpMessage } from 'src/app/services/models/help-message';
import { EventsService } from 'src/app/services/events.service';
import { VideoWebService } from 'src/app/services/video-web.service';
import { ErrorService } from 'src/app/services/error.service';

@Component({
  selector: 'app-vho-hearings',
  templateUrl: './vho-hearings.component.html',
  styleUrls: ['./vho-hearings.component.scss']
})
export class VhoHearingsComponent implements OnInit {

  selectedConferenceUrl: SafeResourceUrl;
  conferences: ConferenceForUserResponse[];
  selectedConference: ConferenceResponse;
  loadingData: boolean;
  adminFrameWidth: number;
  interval: NodeJS.Timer;
  pendingTransferRequests: ConsultationMessage[] = [];
  tasks: TaskResponse[];

  @HostListener('window:resize', ['$event'])
  onResize(event) {
    this.adminFrameWidth = this.getWidthForFrame();
  }

  constructor(
    private videoWebService: VideoWebService,
    private eventService: EventsService,
    private ngZone: NgZone,
    public sanitizer: DomSanitizer,
    private snotifyService: SnotifyService,
    private errorService: ErrorService
  ) {
    this.loadingData = true;
    this.adminFrameWidth = 0;
  }

  ngOnInit() {
    this.setupSubscribers();
    this.retrieveHearingsForUser();
    this.interval = setInterval(() => {
      this.retrieveHearingsForUser();
    }, 30000);
  }

  retrieveHearingsForUser() {
    this.videoWebService.getConferencesForUser().subscribe((data: ConferenceForUserResponse[]) => {
      this.loadingData = false;
      this.conferences = data;
    },
      (error) => {
        this.loadingData = false;
        this.errorService.handleApiError(error);
      });
  }

  hasHearings() {
    return this.conferences !== undefined && this.conferences.length > 0;
  }

  displayAdminViewForConference(conference: ConferenceForUserResponse) {
    if (!this.isCurrentConference(conference)) {
      this.videoWebService.getConferenceById(conference.id)
        .subscribe((data: ConferenceResponse) => {
          this.selectedConference = data;
          this.sanitiseAndLoadIframe();
        },
          (error) => {
            this.errorService.handleApiError(error);
          });

          this.videoWebService.getsAlertsForConference(conference.id)
          .subscribe((data: TaskResponse[]) => {
            this.tasks = data;
          },
            (error) => {
              this.errorService.handleApiError(error);
            });

    }
  }

  isSuspended(conference: ConferenceResponse): boolean {
    return conference.status === ConferenceStatus.Suspended;
  }

  getWidthForFrame(): number {
    const listColumnElement: HTMLElement = document.getElementById('list-column');
    const listWidth = listColumnElement.offsetWidth;
    const windowWidth = window.innerWidth;
    const frameWidth = windowWidth - listWidth - 30;
    return frameWidth;
  }

  getDuration(duration: number): string {
    const h = Math.floor(duration / 60);
    const m = duration % 60;
    const hours = h < 1 ? `${h} hours` : `${h} hour`;
    const minutes = `${m} minutes`;
    if (h > 0) {
      return `${hours} and ${minutes}`;
    } else {
      return `${minutes}`;
    }
  }

  isCurrentConference(conference: ConferenceForUserResponse): boolean {
    return this.selectedConference != null && this.selectedConference.id === conference.id;
  }

  private sanitiseAndLoadIframe() {
    const adminUri = this.selectedConference.admin_i_frame_uri;
    this.adminFrameWidth = this.getWidthForFrame();
    this.selectedConferenceUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
      adminUri
    );
  }

  private setupSubscribers() {
    this.eventService.start();

    this.eventService.getConsultationMessage().subscribe(message => {
      this.ngZone.run(() => {
        this.handleConsultationMessage(message);
      });
    });

    this.eventService.getHelpMessage().subscribe(message => {
      this.ngZone.run(() => {
        this.handleHelpMessage(message);
      });
    });
  }

  handleConsultationMessage(message: ConsultationMessage): void {
    this.ngZone.run(() => {
      if (message.result === ConsultationAnswer.Accepted) {
        this.addTransferTask(message);
      }
    });
  }

  handleHelpMessage(message: HelpMessage): void {
    this.ngZone.run(() => {
      const toastMessage = message.participantName + ' requires assistance in hearing ' + message.conferenceId;
      this.snotifyService.info(toastMessage, {
        position: SnotifyPosition.rightTop,
        showProgressBar: false,
        timeout: 0,
        closeOnClick: true
      });
    });
  }

  addTransferTask(message: ConsultationMessage) {
    this.pendingTransferRequests.push(message);
    const conference = this.conferences.find(x => x.id === message.conferenceId);
    const requester = conference.participants.find(x => x.username === message.requestedBy);
    const requestee = conference.participants.find(x => x.username === message.requestedFor);

    const toastMessage = `Hearing ${conference.case_name}: Please move ${requester.display_name} and
    ${requestee.display_name} into a private room`;

    this.snotifyService.info(toastMessage, {
      position: SnotifyPosition.rightTop,
      showProgressBar: false,
      timeout: 0,
      closeOnClick: true
    });
  }

  dismissTransferTask(message: ConsultationMessage) {
    this.pendingTransferRequests.splice(this.pendingTransferRequests.indexOf(message), 1);
  }
}
