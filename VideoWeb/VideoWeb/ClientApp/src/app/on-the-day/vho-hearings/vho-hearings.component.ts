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
import { Hearing } from 'src/app/shared/models/hearing';
import { TaskCompleted } from '../models/task-completed';

@Component({
  selector: 'app-vho-hearings',
  templateUrl: './vho-hearings.component.html',
  styleUrls: ['./vho-hearings.component.scss']
})
export class VhoHearingsComponent implements OnInit {

  selectedConferenceUrl: SafeResourceUrl;
  conferences: ConferenceForUserResponse[];
  selectedHearing: Hearing;
  loadingData: boolean;
  adminFrameWidth: number;
  adminFrameHeight: number;
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
    this.adminFrameHeight = this.getHeightForFrame();
  }

  ngOnInit() {
    this.setupSubscribers();
    this.retrieveHearingsForVhOfficer();
    this.interval = setInterval(() => {
      this.retrieveHearingsForVhOfficer();
    }, 30000);
  }

  retrieveHearingsForVhOfficer() {
    this.videoWebService.getConferencesForVhOfficer().subscribe((data: ConferenceForUserResponse[]) => {
      this.loadingData = false;
      this.conferences = data;
      if (data && data.length > 0) {
        this.enableFullScreen(true);
      } else {
        this.enableFullScreen(false);
      }

      if (this.selectedHearing) {
        this.getTasksForConference(this.selectedHearing.getConference().id);
      }
    },
      (error) => {
        this.loadingData = false;
        this.enableFullScreen(false);
        this.errorService.handleApiError(error);
      });
  }

  hasHearings(): boolean {
    console.log('checking if has hearings');
    return !this.loadingData && this.conferences && this.conferences.length > 0;
  }

  hasTasks(): boolean {
    return this.selectedHearing !== undefined && this.tasks !== undefined && this.tasks.length > 0;
  }

  onConferenceSelected(conference: ConferenceForUserResponse) {
    if (!this.isCurrentConference(conference)) {
      this.videoWebService.getConferenceById(conference.id)
        .subscribe((data: ConferenceResponse) => {
          this.selectedHearing = new Hearing(data);
          this.sanitiseAndLoadIframe();
        },
          (error) => {
            this.errorService.handleApiError(error);
          });
      this.getTasksForConference(conference.id);
    }
  }

  isCurrentConference(conference: ConferenceForUserResponse): boolean {
    return this.selectedHearing != null && this.selectedHearing.getConference().id === conference.id;
  }

  getWidthForFrame(): number {
    const listColumnElement: HTMLElement = document.getElementById('list-column');
    let listWidth = 0;
    if (listColumnElement) {
      listWidth = listColumnElement.offsetWidth;
    }
    const windowWidth = window.innerWidth;
    const frameWidth = windowWidth - listWidth - 30;
    return frameWidth;
  }

  getHeightForFrame(): number {
    if (this.hasTasks()) {
      return 300;
    } else {
      return 600;
    }
  }

  onTaskCompleted(taskCompleted: TaskCompleted) {
    const conference = this.conferences.find(x => x.id === taskCompleted.conferenceId);
    conference.no_of_pending_tasks = taskCompleted.pendingTasks;
  }

  private sanitiseAndLoadIframe() {
    const adminUri = this.selectedHearing.getConference().admin_i_frame_uri;
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

  getTasksForConference(conferenceId: string) {
    this.videoWebService.getTasksForConference(conferenceId)
      .subscribe((data: TaskResponse[]) => {
        this.tasks = data;
        this.adminFrameHeight = this.getHeightForFrame();
      },
        (error) => {
          this.errorService.handleApiError(error);
        });
  }

  enableFullScreen(fullScreen: boolean) {
    const masterContainer = document.getElementById('master-container');
    if (!masterContainer) {
      return;
    }

    if (fullScreen) {
      masterContainer.classList.add('fullscreen');
    } else {
      masterContainer.classList.remove('fullscreen');
    }
  }
}
