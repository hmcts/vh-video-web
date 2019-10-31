import { Component, OnInit, NgZone } from '@angular/core';
import { ConferenceResponse, ParticipantStatus, ConferenceStatus } from 'src/app/services/clients/api-client';
import { Router, ActivatedRoute } from '@angular/router';
import { EventsService } from 'src/app/services/events.service';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { ParticipantStatusMessage } from 'src/app/services/models/participant-status-message';
import { PageUrls } from 'src/app/shared/page-url.constants';
import { ErrorService } from 'src/app/services/error.service';
import { Hearing } from 'src/app/shared/models/hearing';

@Component({
  selector: 'app-judge-waiting-room',
  templateUrl: './judge-waiting-room.component.html',
  styleUrls: ['./judge-waiting-room.component.scss']
})
export class JudgeWaitingRoomComponent implements OnInit {

  loadingData: boolean;
  conference: ConferenceResponse;
  hearing: Hearing;

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
        this.hearing = new Hearing(data);
      },
        (error) => {
          this.loadingData = false;
          if (!this.errorService.returnHomeIfUnauthorised(error)) {
            this.errorService.handleApiError(error);
          }
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
}
