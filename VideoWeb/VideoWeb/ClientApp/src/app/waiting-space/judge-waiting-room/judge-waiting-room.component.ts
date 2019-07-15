import { Component, OnInit, NgZone } from '@angular/core';
import { ConferenceResponse, ParticipantStatus, ConferenceStatus } from 'src/app/services/clients/api-client';
import { Router, ActivatedRoute } from '@angular/router';
import { EventsService } from 'src/app/services/events.service';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { ParticipantStatusMessage } from 'src/app/services/models/participant-status-message';
import { PageUrls } from 'src/app/shared/page-url.constants';
import { ErrorService } from 'src/app/services/error.service';

@Component({
  selector: 'app-judge-waiting-room',
  templateUrl: './judge-waiting-room.component.html',
  styleUrls: ['./judge-waiting-room.component.css']
})
export class JudgeWaitingRoomComponent implements OnInit {

  loadingData: boolean;
  conference: ConferenceResponse;
  hearingEndTime: Date;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private videoWebService: VideoWebService,
    private eventService: EventsService,
    private ngZone: NgZone,
    private errorService: ErrorService
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

        this.setupSubscribers();
        this.hearingEndTime = this.getHearingEndTime();
      },
        (error) => {
          this.loadingData = false;
          this.errorService.handleApiError(error);
        });
  }

  getConferenceStatusText() {
    switch (this.conference.status) {
      case ConferenceStatus.NotStarted: return 'Start this hearing';
      case ConferenceStatus.Suspended: return 'Hearing suspended';
      case ConferenceStatus.Paused: return 'Hearing paused';
      case ConferenceStatus.Closed: return 'Hearing is closed';
      default: return 'Hearing is in session';
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

  private setupSubscribers() {
    this.eventService.start();

    this.eventService.getHearingStatusMessage().subscribe(message => {
      this.ngZone.run(() => {
        this.handleHearingStatusChange(<ConferenceStatus>message.status);
      });
    });

    this.eventService.getParticipantStatusMessage().subscribe(message => {
      this.ngZone.run(() => {
        this.handleParticipantStatusChange(message);
      });
    });
  }

  handleParticipantStatusChange(message: ParticipantStatusMessage): any {
    const participant = this.conference.participants.find(p => p.username.toLowerCase().trim() === message.email.toLowerCase().trim());
    const status = <ParticipantStatus>message.status;
    participant.status = status;
  }

  handleHearingStatusChange(status: ConferenceStatus) {
    this.conference.status = status;
  }

  checkEquipment() {
    this.router.navigate([PageUrls.EquipmentCheck, this.conference.id]);
  }

  getHearingEndTime(): Date {
    const hearingStartDate = this.conference.scheduled_date_time;
    const hearingEndDate = new Date(hearingStartDate);
    hearingEndDate.setMinutes(hearingStartDate.getMinutes() + this.conference.scheduled_duration);
    return hearingEndDate;
  }

  getScheduledStartTime(): Date {
    const startTime = new Date(this.conference.scheduled_date_time.getTime());
    return startTime;
  }

  getScheduledEndTime(): Date {
    const endTime = new Date(this.conference.scheduled_date_time.getTime());
    endTime.setUTCMinutes(endTime.getUTCMinutes() + this.conference.scheduled_duration);
    return endTime;
  }

  hearingSuspended(): boolean {
    return this.conference.status === ConferenceStatus.Suspended;
  }

  hearingPaused(): boolean {
    return this.conference.status === ConferenceStatus.Paused;
  }
}
