import {
  Component,
  HostListener,
  NgZone,
  OnDestroy,
  OnInit,
  ViewChild
} from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import {
  ConferenceForUserResponse,
  ConferenceResponse,
  ParticipantResponse,
  TaskResponse,
  ParticipantStatus
} from 'src/app/services/clients/api-client';
import { ErrorService } from 'src/app/services/error.service';
import { EventsService } from 'src/app/services/events.service';
import { ConferenceStatusMessage } from 'src/app/services/models/conference-status-message';
import { ParticipantStatusMessage } from 'src/app/services/models/participant-status-message';
import { Hearing } from 'src/app/shared/models/hearing';
import { TaskCompleted } from '../../on-the-day/models/task-completed';
import { Logger } from 'src/app/services/logging/logger-base';

import * as $ from 'jquery';
import { Subscription } from 'rxjs';
import { VhoHearingListComponent } from '../vho-hearing-list/vho-hearing-list.component';
import {
  ConferenceForUser,
  ExtendedConferenceStatus,
  HearingsFilter
} from '../../shared/models/hearings-filter';
import { SessionStorage } from '../../services/session-storage';
import { UserRole } from 'src/app/services/clients/api-client';
import { ParticipantStatusModel } from 'src/app/shared/models/participants-status-model';
import { Participant } from 'src/app/shared/models/participant';

@Component({
  selector: 'app-vho-hearings',
  templateUrl: './vho-hearings.component.html',
  styleUrls: ['./vho-hearings.component.scss']
})
export class VhoHearingsComponent implements OnInit, OnDestroy {
  adminFrameWidth: number;
  adminFrameHeight: number;

  interval: NodeJS.Timer;
  loadingData: boolean;

  conferences: ConferenceForUserResponse[];
  conferencesAll: ConferenceForUserResponse[];
  selectedHearing: Hearing;
  participants: ParticipantResponse[];
  participantStatusModel: ParticipantStatusModel;
  selectedConferenceUrl: SafeResourceUrl;

  tasks: TaskResponse[];
  conferencesSubscription: Subscription;

  displayFilter = false;
  filterOptionsCount = 0;
  private readonly hearingsFilterStorage: SessionStorage<HearingsFilter>;
  readonly HEARINGS_FITER_KEY = 'vho.hearings.filter';

  @ViewChild('conferenceList', { static: false })
  $conferenceList: VhoHearingListComponent;

  @HostListener('window:resize', ['$event'])
  onResize(event) {
    this.updateWidthForAdminFrame();
  }

  constructor(
    private videoWebService: VideoWebService,
    public sanitizer: DomSanitizer,
    private errorService: ErrorService,
    private ngZone: NgZone,
    private eventService: EventsService,
    private logger: Logger
  ) {
    this.loadingData = true;
    this.adminFrameWidth = 0;
    this.adminFrameHeight = this.getHeightForFrame();
    this.hearingsFilterStorage = new SessionStorage(this.HEARINGS_FITER_KEY);
  }

  ngOnInit() {
    this.logger.info('Loading VH Officer Dashboard');
    this.retrieveHearingsForVhOfficer();
    this.interval = setInterval(() => {
      this.retrieveHearingsForVhOfficer();
    }, 30000);
    this.setupEventHubSubscribers();
  }

  @HostListener('window:beforeunload')
  ngOnDestroy(): void {
    this.logger.debug('Clearing intervals and subscriptions for VH Officer');
    clearInterval(this.interval);
    this.conferencesSubscription.unsubscribe();
  }

  private setupEventHubSubscribers() {
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

    this.logger.debug('Subscribing to event hub disconnects');
    this.eventService.getServiceDisconnected().subscribe(() => {
      this.ngZone.run(() => {
        this.logger.info(`event hub disconnection for vh officer`);
        this.refreshConferenceDataDuringDisconnect();
      });
    });

    this.logger.debug('Subscribing to event hub reconnects');
    this.eventService.getServiceReconnected().subscribe(() => {
      this.ngZone.run(() => {
        this.logger.info(`event hub re-connected for vh officer`);
        this.refreshConferenceDataDuringDisconnect();
      });
    });
  }

  refreshConferenceDataDuringDisconnect() {
    this.retrieveHearingsForVhOfficer();
    if (this.selectedHearing) {
      this.retrieveConferenceDetails(this.selectedHearing.id);
    }
  }

  retrieveHearingsForVhOfficer() {
    this.conferencesSubscription = this.videoWebService
      .getConferencesForVHOfficer()
      .subscribe(
        (data: ConferenceForUserResponse[]) => {
          this.loadingData = false;
          this.conferences = data;
          this.conferencesAll = data;
          if (data && data.length > 0) {
            this.logger.debug('VH Officer has conferences');
            this.applyActiveFilter();
            this.enableFullScreen(true);
          } else {
            this.logger.debug('VH Officer has no conferences');
            this.enableFullScreen(false);
          }

          if (this.selectedHearing) {
            this.logger.debug(
              `Retrieving tasks for conference ${this.selectedHearing.id}`
            );
            this.getTasksForConference(this.selectedHearing.getConference().id);
          }
        },
        error => {
          this.logger.error(
            'There was an error setting up VH Officer dashboard',
            error
          );
          this.loadingData = false;
          this.enableFullScreen(false);
          this.errorService.handleApiError(error);
        }
      );
  }

  applyActiveFilter() {
    const filter = this.hearingsFilterStorage.get();
    if (filter) {
      this.activateFilterOptions(filter);
    }
  }

  hasHearings(): boolean {
    return (
      !this.loadingData && this.conferencesAll && this.conferencesAll.length > 0
    );
  }

  hasTasks(): boolean {
    return (
      this.selectedHearing !== undefined &&
      this.tasks !== undefined &&
      this.tasks.length > 0
    );
  }

  isHearingSelected(): boolean {
    return !!(this.selectedHearing && this.selectedHearing.getConference());
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
      this.retrieveConferenceDetails(conference.id);
    }
  }

  retrieveConferenceDetails(conferenceId: string) {
    this.videoWebService.getConferenceById(conferenceId).subscribe(
      (data: ConferenceResponse) => {
        this.selectedHearing = new Hearing(data);
        this.participants = data.participants;
        this.sanitiseAndLoadIframe();
        this.getTasksForConference(conferenceId);
        this.getJudgeStatusDetails();
      },
      error => {
        this.logger.error(
          `There was an error when selecting conference ${conferenceId}`,
          error
        );
        if (!this.errorService.returnHomeIfUnauthorised(error)) {
          this.errorService.handleApiError(error);
        }
      }
    );
  }

  isCurrentConference(conference: ConferenceForUserResponse): boolean {
    return (
      this.selectedHearing != null &&
      this.selectedHearing.getConference().id === conference.id
    );
  }

  updateWidthForAdminFrame(): void {
    const listColumnElement: HTMLElement = document.getElementById(
      'list-column'
    );
    let listWidth = 0;
    if (listColumnElement) {
      listWidth = listColumnElement.offsetWidth;
    }
    const windowWidth = window.innerWidth;
    this.adminFrameWidth = windowWidth - listWidth - 350;
  }

  getHeightForFrame(): number {
    if (this.hasTasks()) {
      return 300;
    } else {
      return 600;
    }
  }

  onTaskCompleted(taskCompleted: TaskCompleted) {
    this.logger.info(
      `task completed for conference ${taskCompleted.conferenceId}`
    );
    const conference = this.conferences.find(
      x => x.id === taskCompleted.conferenceId
    );
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
    const participantToUpdate = this.participants.find(
      x => x.id === message.participantId
    );
    if (participantToUpdate) {
      participantToUpdate.status = message.status;
      if (participantToUpdate.role === UserRole.Judge) {
        this.getJudgeStatusDetails();
      }
    }
  }

  handleConferenceStatusChange(message: ConferenceStatusMessage) {
    const conference = this.conferences.find(
      c => c.id === message.conferenceId
    );
    if (!conference) {
      return;
    }
    conference.status = message.status;
    if (
      this.isCurrentConference(
        new ConferenceForUserResponse({ id: message.conferenceId })
      )
    ) {
      this.selectedHearing.getConference().status = message.status;
    }
  }

  getTasksForConference(conferenceId: string) {
    this.videoWebService.getTasksForConference(conferenceId).subscribe(
      (data: TaskResponse[]) => {
        this.tasks = data;
        this.adminFrameHeight = this.getHeightForFrame();
      },
      error => {
        this.errorService.handleApiError(error);
      }
    );
  }

  enableFullScreen(fullScreen: boolean) {
    const masterContainerCount = $("div[id*='master-container']").length;
    if (masterContainerCount > 1) {
      throw new Error('Multiple master containers in DOM');
    }

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

  showFilter() {
    this.displayFilter = !this.displayFilter;
  }

  applyFilters(filterOptions: HearingsFilter) {
    console.log('VHO hearings applyed filters');
    const selectedConferenceId = this.$conferenceList.currentConference
      ? this.$conferenceList.currentConference.id
      : '';
    this.clearSelectedConference();
    this.$conferenceList.currentConference = null;

    this.hearingsFilterStorage.set(filterOptions);
    this.displayFilter = false;

    this.activateFilterOptions(filterOptions);

    this.selectFilteredConference(selectedConferenceId);
  }

  selectFilteredConference(selectedConferenceId: string) {
    if (selectedConferenceId) {
      const selectedConferenceFound = this.conferences.filter(
        x => x.id === selectedConferenceId
      );
      if (selectedConferenceFound) {
        this.$conferenceList.selectConference(selectedConferenceFound[0]);
      }
    }
  }

  activateFilterOptions(filterOptions: HearingsFilter) {
    this.filterOptionsCount = filterOptions.numberFilterOptions;

    const selectedStatuses = filterOptions.statuses
      .filter(x => x.Selected)
      .map(x => x.Status);
    const selectedLocations = filterOptions.locations
      .filter(x => x.Selected)
      .map(x => x.Description);
    const selectedAlerts = filterOptions.alerts
      .filter(x => x.Selected)
      .map(x => x.BodyText);

    if (
      selectedStatuses.length > 0 ||
      selectedLocations.length > 0 ||
      selectedAlerts.length > 0
    ) {
      this.conferences = Object.assign(this.conferencesAll);
      if (selectedStatuses.length > 0) {
        const conferencesAllExtended = this.setStatusDelayed(
          this.conferencesAll
        );
        this.conferences = conferencesAllExtended.filter(x =>
          selectedStatuses.includes(x.StatusExtended)
        );
      }
      if (selectedLocations.length > 0) {
        this.conferences = this.conferences.filter(x =>
          selectedLocations.includes(x.hearing_venue_name)
        );
      }
      if (selectedAlerts.length > 0) {
        this.conferences = this.conferences.filter(x =>
          this.findSelectedAlert(x.tasks, selectedAlerts)
        );
      }
    } else {
      this.conferences = this.conferencesAll;
    }
  }

  private findSelectedAlert(
    tasks: TaskResponse[],
    selectedAlerts: string[]
  ): boolean {
    let tasksFiltered = [];
    if (tasks) {
      tasksFiltered = tasks.filter(x =>
        this.filterTaskByBody(selectedAlerts, x.body)
      );
    }
    return tasksFiltered.length > 0;
  }

  private filterTaskByBody(selectedAlerts: string[], body: string): boolean {
    let result = false;
    selectedAlerts.forEach(x => {
      if (body.includes(x)) {
        result = true;
      }
    });
    return result;
  }

  setStatusDelayed(data: ConferenceForUserResponse[]) {
    const conferences = data.map(x => {
      const hearing = new Hearing(x);
      const item = new ConferenceForUser(x);
      if (hearing.isDelayed()) {
        item.StatusExtended = ExtendedConferenceStatus.Delayed;
      }
      return item;
    });

    return conferences;
  }

  getJudgeStatusDetails() {
    if (this.selectedHearing) {

      this.participantStatusModel = new ParticipantStatusModel();
      this.participantStatusModel.Participants = this.participants.map(p => new Participant(p));
      this.participantStatusModel.JudgeStatuses = this.getJudgeDetailsForStatus(this.selectedHearing.id);
    }
  }

  getJudgeDetailsForStatus(selectedConferenceId: string) {
    const judgeStatuses: ParticipantStatus[] = [];
    const selectedJudges = this.participants.filter(
      x => x.role === UserRole.Judge
    );
    if (selectedJudges.length > 0) {
      const selectedJudgeUserName = selectedJudges[0].username;
      const anotherConferences = this.conferencesAll.filter(
        x => x.id !== selectedConferenceId
      );
      anotherConferences.forEach(x => {
        const judgeStatus = this.findJudgeInAnotherHearing(
          x.participants,
          selectedJudgeUserName
        );
        if (judgeStatus !== null) {
          judgeStatuses.push(judgeStatus);
        }
      });
    }

    return judgeStatuses;
  }

  private findJudgeInAnotherHearing(
    participantsIn: ParticipantResponse[],
    selectedJudgeUserName: string
  ): ParticipantStatus {
    const judgeStatusInAnotherHearings = participantsIn
      .filter(x => x.username === selectedJudgeUserName)
      .map(x => x.status);
    return judgeStatusInAnotherHearings.length > 0
      ? judgeStatusInAnotherHearings[0]
      : null;
  }
}
