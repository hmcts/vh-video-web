import { Component, OnInit, NgZone } from '@angular/core';
import { ConferenceResponse, ParticipantStatus, ConferenceStatus } from 'src/app/services/clients/api-client';
import { Router, ActivatedRoute } from '@angular/router';
import { ServerSentEventsService } from 'src/app/services/server-sent-events.service';
import { VideoWebService } from 'src/app/services/video-web.service';
import { ParticipantStatusMessage } from 'src/app/services/models/participant-status-message';

@Component({
  selector: 'app-judge-waiting-room',
  templateUrl: './judge-waiting-room.component.html',
  styleUrls: ['./judge-waiting-room.component.css']
})
export class JudgeWaitingRoomComponent implements OnInit {

  loadingData: boolean;
  conference: ConferenceResponse;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private videoWebService: VideoWebService,
    private eventService: ServerSentEventsService,
    private ngZone: NgZone
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
      },
        () => {
          this.loadingData = false;
          this.router.navigate(['home']);
        });
  }

  getConferenceStatusText() {
    switch (this.conference.status) {
      case ConferenceStatus.NotStarted: return 'Start the hearing';
      case ConferenceStatus.Suspended: return 'Resume the hearing';
      case ConferenceStatus.Paused: return 'Resume the hearing';
      case ConferenceStatus.Closed: return 'Hearing is closed';
      default: return '';
    }
  }

  isNotStarted(): boolean {
    return this.conference.status === ConferenceStatus.NotStarted;
  }

  isPaused(): boolean {
    return this.conference.status === ConferenceStatus.Paused || this.conference.status === ConferenceStatus.Suspended;
  }

  goToHearingPage(): void {
    this.router.navigate(['/judge-hearing-room', this.conference.id]);
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
}
