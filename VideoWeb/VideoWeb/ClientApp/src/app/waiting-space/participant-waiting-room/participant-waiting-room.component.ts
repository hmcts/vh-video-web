import { Component, NgZone, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AdalService } from 'adal-angular4';
import { ConferenceResponse, ConferenceStatus, ParticipantResponse, ParticipantStatus } from 'src/app/services/clients/api-client';
import { ParticipantStatusMessage } from 'src/app/services/models/participant-status-message';
import { EventsService } from 'src/app/services/events.service';
import { VideoWebService } from 'src/app/services/video-web.service';
import { ConferenceStatusMessage } from 'src/app/services/models/conference-status-message';
import { ErrorService } from 'src/app/services/error.service';
declare var PexRTC: any;

@Component({
  selector: 'app-participant-waiting-room',
  templateUrl: './participant-waiting-room.component.html',
  styleUrls: ['./participant-waiting-room.component.css']
})
export class ParticipantWaitingRoomComponent implements OnInit {

  loadingData: boolean;
  statusUpdated: boolean;
  conference: ConferenceResponse;
  participant: ParticipantResponse;

  pexipAPI: any;
  stream: any;
  connected: boolean;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private videoWebService: VideoWebService,
    private eventService: EventsService,
    private ngZone: NgZone,
    private adalService: AdalService,
    private errorService: ErrorService
  ) {
    this.loadingData = true;
  }

  ngOnInit() {
    this.connected = false;
    this.getConference();
  }

  getConference(): void {
    const conferenceId = this.route.snapshot.paramMap.get('conferenceId');
    this.videoWebService.getConferenceById(conferenceId)
      .subscribe((data: ConferenceResponse) => {
        this.loadingData = false;
        this.conference = data;
        this.participant = data.participants.find(x => x.username.toLowerCase() === this.adalService.userInfo.userName.toLowerCase());
        this.refresh();
        this.setupSubscribers();
        this.setupPexipClient();
        this.call();
      },
        (error) => {
          this.loadingData = false;
          this.errorService.handleApiError(error);
        });
  }

  getConferenceStatusText(): string {
    switch (this.conference.status) {
      case ConferenceStatus.Suspended: return 'is suspended';
      case ConferenceStatus.Paused: return 'is paused';
      case ConferenceStatus.Closed: return 'is closed';
      default: return '';
    }
  }

  isClosed(): boolean {
    return this.conference.status === ConferenceStatus.Closed;
  }

  isSuspended(): boolean {
    return this.conference.status === ConferenceStatus.Suspended;
  }

  isPaused(): boolean {
    return this.conference.status === ConferenceStatus.Paused;
  }

  private setupSubscribers() {
    this.eventService.start();

    this.eventService.getHearingStatusMessage().subscribe(message => {
      this.ngZone.run(() => {
        this.handleConferenceStatusChange(message);
      });
    });

    this.eventService.getParticipantStatusMessage().subscribe(message => {
      this.ngZone.run(() => {
        this.handleParticipantStatusChange(message);
      });
    });
  }

  handleParticipantStatusChange(message: ParticipantStatusMessage): any {
    const participant = this.conference.participants.find(p => p.username.toLowerCase() === message.email.toLowerCase());
    participant.status = message.status;
    this.refresh();
  }

  handleConferenceStatusChange(message: ConferenceStatusMessage) {
    this.conference.status = message.status;
    this.refresh();
  }

  refresh() {
    this.statusUpdated = false;
    setTimeout(() => this.statusUpdated = true);
  }

  setupPexipClient() {
    const self = this;
    this.pexipAPI = new PexRTC();

    this.pexipAPI.onSetup = function (stream, pin_status, conference_extension) {
      console.info('running pexip setup');
      this.connect('0000', null);
    };

    this.pexipAPI.onConnect = function (stream) {
      self.connected = true;
      console.info('successfully connected');
      self.stream = stream;
    };

    this.pexipAPI.onError = function (reason) {
      self.connected = false;
      console.warn('Error from pexip. Reason : ' + reason);
      self.errorService.goToServiceError();
    };

    this.pexipAPI.onDisconnect = function (reason) {
      self.connected = false;
      console.info('Disconnected from pexip. Reason : ' + reason);
    };
  }

  call() {
    const pexipNode = this.conference.pexip_node_uri + 'fiudshfiudshfi';
    const conferenceAlias = this.conference.participant_uri;
    const displayName = this.participant.tiled_display_name;
    this.pexipAPI.makeCall(pexipNode, conferenceAlias, displayName, null);
  }

  showVideo(): boolean {
    if (!this.connected) {
      return false;
    }

    if (this.conference.status === ConferenceStatus.InSession) {
      return true;
    }

    if (this.participant.status === ParticipantStatus.InConsultation) {
      return true;
    }
  }
}
