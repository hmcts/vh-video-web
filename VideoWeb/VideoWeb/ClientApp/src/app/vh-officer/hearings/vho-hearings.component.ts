import { Component, HostListener, NgZone, OnInit } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import {
  ConferenceForUserResponse, ConferenceResponse, ConsultationAnswer, ParticipantResponse, TaskResponse
} from 'src/app/services/clients/api-client';
import { ErrorService } from 'src/app/services/error.service';
import { EventsService } from 'src/app/services/events.service';
import { ConferenceStatusMessage } from 'src/app/services/models/conference-status-message';
import { ConsultationMessage } from 'src/app/services/models/consultation-message';
import { HelpMessage } from 'src/app/services/models/help-message';
import { ParticipantStatusMessage } from 'src/app/services/models/participant-status-message';
import { NotificationService } from 'src/app/services/notification.service';
import { Hearing } from 'src/app/shared/models/hearing';
import { TaskCompleted } from '../../on-the-day/models/task-completed';
import { Logger } from 'src/app/services/logging/logger-base';

@Component({
  selector: 'app-vho-hearings',
  templateUrl: './vho-hearings.component.html',
  styleUrls: ['./vho-hearings.component.scss']
})
export class VhoHearingsComponent implements OnInit {

  adminFrameWidth: number;
  adminFrameHeight: number;

  interval: NodeJS.Timer;
  loadingData: boolean;

  conferences: ConferenceForUserResponse[];
  selectedHearing: Hearing;
  participants: ParticipantResponse[];
  selectedConferenceUrl: SafeResourceUrl;

  pendingTransferRequests: ConsultationMessage[] = [];
  tasks: TaskResponse[];

  @HostListener('window:resize', ['$event'])
  onResize(event) {
    this.updateWidthForAdminFrame();
  }

  constructor(
    private videoWebService: VideoWebService,
    public sanitizer: DomSanitizer,
    private notificationService: NotificationService,
    private errorService: ErrorService,
    private ngZone: NgZone,
    private eventService: EventsService,
    private logger: Logger
  ) {
    this.loadingData = true;
    this.adminFrameWidth = 0;
    this.adminFrameHeight = this.getHeightForFrame();
  }

  ngOnInit() {
    this.logger.info('Loading VH Officer Dashboard');
    this.retrieveHearingsForVhOfficer();
    this.interval = setInterval(() => {
      this.retrieveHearingsForVhOfficer();
    }, 30000);
    this.setupSubscribers();
  }

  private setupSubscribers() {
    this.logger.debug('Setting up VH Officer event subscribers');
    this.eventService.start();

    this.logger.debug('Subscribing to conference status changes...');
    this.eventService.getHearingStatusMessage().subscribe(message => {
      this.ngZone.run(() => {
        this.handleConferenceStatusChange(message);
      });
    });

    this.logger.debug('Subscribing to participant status changes...');
    this.eventService.getParticipantStatusMessage().subscribe(message => {
      this.ngZone.run(() => {
        this.handleParticipantStatusChange(message);
      });
    });
  }

  retrieveHearingsForVhOfficer() {
    this.videoWebService.getConferencesForVHOfficer().subscribe((data: ConferenceForUserResponse[]) => {
      this.loadingData = false;
      this.conferences = data;
      if (data && data.length > 0) {
        this.logger.debug('VH Officer has conferences');
        this.enableFullScreen(true);
      } else {
        this.logger.debug('VH Officer has no conferences');
        this.enableFullScreen(false);
      }

      if (this.selectedHearing) {
        this.logger.debug(`Retrieving tasks for conference ${this.selectedHearing.id}`);
        this.getTasksForConference(this.selectedHearing.getConference().id);
      }
    },
      (error) => {
        this.logger.error('There was an error setting up VH Officer dashboard', error);
        this.loadingData = false;
        this.enableFullScreen(false);
        this.errorService.handleApiError(error);
      });
  }

  hasHearings(): boolean {
    return !this.loadingData && this.conferences && this.conferences.length > 0;
  }

  hasTasks(): boolean {
    return this.selectedHearing !== undefined && this.tasks !== undefined && this.tasks.length > 0;
  }

  isHearingSelected(): boolean {
    if (this.selectedHearing && this.selectedHearing.getConference()) {
      return true;
    } else {
      return false;
    }
  }

  clearSelectedConference() {
    this.selectedHearing = null;
    this.selectedConferenceUrl = null;
    this.tasks = [];
  }

  onConferenceSelected(conference: ConferenceForUserResponse) {
    this.logger.info(`Conference ${conference.id} selected`);
    if (!this.isCurrentConference(conference)) {
      this.clearSelectedConference();
      this.videoWebService.getConferenceById(conference.id)
        .subscribe((data: ConferenceResponse) => {
          this.selectedHearing = new Hearing(data);
          this.participants = data.participants;
          this.sanitiseAndLoadIframe();
          this.getTasksForConference(conference.id);
        },
          (error) => {
            this.logger.error(`There was an error when selecting conference ${conference.id}`, error);
            if (!this.errorService.returnHomeIfUnauthorised(error)) {
              this.errorService.handleApiError(error);
            }
          });
    }
  }

  isCurrentConference(conference: ConferenceForUserResponse): boolean {
    return this.selectedHearing != null && this.selectedHearing.getConference().id === conference.id;
  }

  updateWidthForAdminFrame(): void {
    const listColumnElement: HTMLElement = document.getElementById('list-column');
    let listWidth = 0;
    if (listColumnElement) {
      listWidth = listColumnElement.offsetWidth;
    }
    const windowWidth = window.innerWidth;
    const frameWidth = windowWidth - listWidth - 350;
    this.adminFrameWidth = frameWidth;
  }

  getHeightForFrame(): number {
    if (this.hasTasks()) {
      return 300;
    } else {
      return 600;
    }
  }

  onTaskCompleted(taskCompleted: TaskCompleted) {
    this.logger.info(`task completed for conference ${taskCompleted.conferenceId}`);
    const conference = this.conferences.find(x => x.id === taskCompleted.conferenceId);
    conference.no_of_pending_tasks = taskCompleted.pendingTasks;
  }

  private sanitiseAndLoadIframe() {
    const adminUri = this.selectedHearing.getConference().admin_i_frame_uri;
    this.updateWidthForAdminFrame();
    this.selectedConferenceUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
      adminUri
    );
  }

  handleParticipantStatusChange(message: ParticipantStatusMessage): any {
    if (!this.participants) {
      return;
    }
    const participantToUpdate = this.participants.find(x => x.username === message.email);
    if (participantToUpdate) {
      participantToUpdate.status = message.status;
    }
  }

  handleConferenceStatusChange(message: ConferenceStatusMessage) {
    const conference = this.conferences.find(c => c.id === message.conferenceId);
    if (!conference) {
      return;
    }
    conference.status = message.status;
    if (this.isCurrentConference(new ConferenceForUserResponse({ id: message.conferenceId }))) {
      this.selectedHearing.getConference().status = message.status;
    }
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
      this.notificationService.info(toastMessage, 0, true);
    });
  }

  addTransferTask(message: ConsultationMessage) {
    this.pendingTransferRequests.push(message);
    const conference = this.conferences.find(x => x.id === message.conferenceId);
    const requester = conference.participants.find(x => x.username === message.requestedBy);
    const requestee = conference.participants.find(x => x.username === message.requestedFor);

    const toastMessage = `Hearing ${conference.case_name}: Please move ${requester.display_name} and
    ${requestee.display_name} into a private room`;
    this.notificationService.info(toastMessage, 0, true);
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
