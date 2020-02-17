import { Component, OnInit, NgZone, HostListener, OnDestroy, AfterViewInit } from '@angular/core';
import { ConferenceResponse, ParticipantStatus, ConferenceStatus } from 'src/app/services/clients/api-client';
import { Router, ActivatedRoute } from '@angular/router';
import { EventsService } from 'src/app/services/events.service';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { ParticipantStatusMessage } from 'src/app/services/models/participant-status-message';
import { PageUrls } from 'src/app/shared/page-url.constants';
import { ErrorService } from 'src/app/services/error.service';
import { Hearing } from 'src/app/shared/models/hearing';
import { Logger } from 'src/app/services/logging/logger-base';
import { AdalService } from 'adal-angular4';
import { JudgeEventService } from 'src/app/services/judge-event.service';
import { interval, Subscription, Observable } from 'rxjs';
import { async } from 'rxjs/internal/scheduler/async';
import { DeviceTypeService } from 'src/app/services/device-type.service';

@Component({
  selector: 'app-judge-waiting-room',
  templateUrl: './judge-waiting-room.component.html',
  styleUrls: ['./judge-waiting-room.component.scss'],
})
export class JudgeWaitingRoomComponent implements OnInit, OnDestroy {
  loadingData: boolean;
  conference: ConferenceResponse;
  hearing: Hearing;
  $afterStayOnSubcription: Subscription;
  intervalSource: Observable<number>;
  isUnload = false;

  apiSubscriptions: Subscription = new Subscription();
  eventHubSubscriptions: Subscription = new Subscription();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private videoWebService: VideoWebService,
    private eventService: EventsService,
    private ngZone: NgZone,
    private errorService: ErrorService,
    private logger: Logger,
    private adalService: AdalService,
    private judgeEventService: JudgeEventService,
    private deviceTypeService: DeviceTypeService
  ) {
    this.loadingData = true;
  }

  ngOnInit() {
    this.getConference().then(() => {
      this.setupEventHubSubscribers();
      this.setupConferenceChatSubscription();
    });

    this.firefoxUnload();
    this.subcribeForStayOn();

  }

  async firefoxUnload() {
    if (this.judgeEventService.isUnload() && this.deviceTypeService.getBrowserName() === 'Firefox') {
      this.isUnload = true;
      this.judgeEventService.clearJudgeUnload();
      await this.judgeEventService.raiseJudgeUnavailableEvent();
    }
  }

  // if the user after logged out in the browser dialog selected stay on,
  // then the satatus should be updated back to available. It's not possible to
  // detect browser leave/stay on button click event(security reason).
  // The interval is used to detect stay on.
  subcribeForStayOn() {
    if (!this.isUnload) {
      this.intervalSource = interval(10000);
      this.$afterStayOnSubcription = this.intervalSource.subscribe(() => {
        this.afterStayOn();
      });
    }
  }

  afterStayOn() {
    this.judgeEventService.setJudgeUnload();
    this.postEventJudgeAvailableStatus();
  }

  @HostListener('window:beforeunload')
  ngOnDestroy(): void {
    this.logger.debug('Clearing intervals and subscriptions for judge waiting room');
    this.eventHubSubscriptions.unsubscribe();
    this.apiSubscriptions.unsubscribe();

    if (this.$afterStayOnSubcription) {
      this.$afterStayOnSubcription.unsubscribe();
    }
  }

  private setupConferenceChatSubscription() {
    this.logger.debug('Setting up VH Officer chat hub subscribers');
  }

  sendMessage() {
    this.eventService.sendMessage(this.conference.id, `message from judge ${this.adalService.userInfo.userName}`);
  }

  async getConference() {
    const conferenceId = this.route.snapshot.paramMap.get('conferenceId');
    return this.videoWebService
      .getConferenceById(conferenceId)
      .toPromise()
      .then((data: ConferenceResponse) => {
        this.loadingData = false;
        this.conference = data;
        if (!this.judgeEventService.isUnload()) {
          this.postEventJudgeAvailableStatus();
        }
        this.hearing = new Hearing(data);
      })
      .catch(error => {
        this.loadingData = false;
        this.ngZone.run(() => {
          if (!this.errorService.returnHomeIfUnauthorised(error)) {
            this.errorService.handleApiError(error);
          }
        });
      });
  }

  async postEventJudgeAvailableStatus() {
    if (this.conference) {
      const participant = this.conference.participants.find(
        x =>
          x.username.toLocaleLowerCase() ===
          this.adalService.userInfo.userName.toLocaleLowerCase()
      );
      if (participant) {
        await this.judgeEventService.raiseJudgeAvailableEvent(this.conference.id, participant.id.toString());
      }
    }
  }


  getConferenceStatusText() {
    switch (this.conference.status) {
      case ConferenceStatus.NotStarted:
        return 'Start this hearing';
      case ConferenceStatus.Suspended:
        return 'Hearing suspended';
      case ConferenceStatus.Paused:
        return 'Hearing paused';
      case ConferenceStatus.Closed:
        return 'Hearing is closed';
      default:
        return 'Hearing is in session';
    }
  }

  isNotStarted(): boolean {
    return this.conference.status === ConferenceStatus.NotStarted;
  }

  isPaused(): boolean {
    return this.conference.status === ConferenceStatus.Paused || this.conference.status === ConferenceStatus.Suspended;
  }

  goToHearingPage(): void {
    this.router.navigate([PageUrls.JudgeHearingRoom, this.conference.id]);
  }

  goToJudgeHearingList(): void {
    this.router.navigate([PageUrls.JudgeHearingList]);
  }

  setupEventHubSubscribers() {
    this.eventService.start();

    this.eventHubSubscriptions.add(
      this.eventService.getHearingStatusMessage().subscribe(message => {
        this.ngZone.run(() => {
          this.handleHearingStatusChange(<ConferenceStatus>message.status);
        });
      })
    );

    this.eventHubSubscriptions.add(
      this.eventService.getParticipantStatusMessage().subscribe(message => {
        this.ngZone.run(() => {
          this.handleParticipantStatusChange(message);
        });
      })
    );

    this.logger.debug('Subscribing to event hub disconnects');
    this.eventHubSubscriptions.add(
      this.eventService.getServiceDisconnected().subscribe(() => {
        this.ngZone.run(() => {
          this.logger.info(`event hub disconnection for vh officer`);
          this.getConference();
        });
      })
    );

    this.logger.debug('Subscribing to event hub reconnects');
    this.eventHubSubscriptions.add(
      this.eventService.getServiceReconnected().subscribe(() => {
        this.ngZone.run(() => {
          this.logger.info(`event hub re-connected for vh officer`);
          this.getConference();
        });
      })
    );

    this.logger.debug('Subscribing to chat messages');
    this.eventHubSubscriptions.add(
      this.eventService.getChatMessage().subscribe(message => {
        this.logger.debug('message received');
        this.logger.debug(JSON.stringify(message));
      })
    );
  }

  handleParticipantStatusChange(message: ParticipantStatusMessage): any {
    const participant = this.conference.participants.find(p => p.id === message.participantId);
    const status = <ParticipantStatus>message.status;
    participant.status = status;
  }

  handleHearingStatusChange(status: ConferenceStatus) {
    this.conference.status = status;
  }

  checkEquipment() {
    this.router.navigate([PageUrls.EquipmentCheck, this.conference.id]);
  }

  hearingSuspended(): boolean {
    return this.conference.status === ConferenceStatus.Suspended;
  }

  hearingPaused(): boolean {
    return this.conference.status === ConferenceStatus.Paused;
  }

  @HostListener('window:beforeunload', ['$event'])
  public async beforeunloadHandler($event: any) {
    $event.preventDefault();
    $event.returnValue = 'save';

    this.judgeEventService.setJudgeUnload();
    await this.judgeEventService.raiseJudgeUnavailableEvent();

  }
}
