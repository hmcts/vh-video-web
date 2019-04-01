import { Component, OnInit, NgZone } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { VideoWebService } from 'src/app/services/video-web.service';
import { ConferenceResponse, ParticipantStatus, ConferenceStatus, ParticipantResponse } from 'src/app/services/clients/api-client';
import { ServerSentEventsService } from 'src/app/services/server-sent-events.service';
import { ParticipantStatusMessage } from 'src/app/services/models/participant-status-message';
import { AdalService } from 'adal-angular4';
declare var PexRTC: any;

@Component({
  selector: 'app-participant-waiting-room',
  templateUrl: './participant-waiting-room.component.html',
  styleUrls: ['./participant-waiting-room.component.css']
})
export class ParticipantWaitingRoomComponent implements OnInit {

  loadingData: boolean;
  conference: ConferenceResponse;
  participant: ParticipantResponse;

  pexipAPI: any;
  stream: any;
  connected: boolean;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private videoWebService: VideoWebService,
    private eventService: ServerSentEventsService,
    private ngZone: NgZone,
    private adalService: AdalService
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
        if (data) {
          this.participant = data.participants.find(x => x.username.toLowerCase() === this.adalService.userInfo.userName.toLowerCase());
          this.setupSubscribers();
          this.setupPexipClient();
          this.call();
        }
      },
        () => {
          this.loadingData = false;
          this.router.navigate(['home']);
        });
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
    const participant = this.conference.participants.find(p => p.username.toLowerCase() === message.email.toLowerCase());
    const status = <ParticipantStatus>message.status;
    participant.status = status;
  }

  handleHearingStatusChange(status: ConferenceStatus) {
    this.conference.status = status;
  }

  setupPexipClient() {
    const self = this;
    this.pexipAPI = new PexRTC();

    this.pexipAPI.onSetup = function (stream, pin_status, conference_extension) {
      console.info('running pexip setup');
      this.connect('0000', null);
    };

    // This method is called automatically after "pexipAPI.connect()", which is called in "pexipAPI.onSetup()""
    // Accesses the html <video> element meant for incoming feed
    this.pexipAPI.onConnect = function (stream) {
      self.connected = true;
      console.info('successfully connected');
      self.stream = stream;
    };

    this.pexipAPI.onError = function (reason) {
      self.connected = false;
      console.warn('Error from pexip. Reason : ' + reason);
    };

    this.pexipAPI.onDisconnect = function (reason) {
      self.connected = false;
      console.info('Disconnected from pexip. Reason : ' + reason);
    };
  }

  call() {
    const pexipNode = this.conference.pexip_node_uri;
    const conferenceAlias = this.conference.participant_uri;
    const displayName = this.participant.tiled_display_name;
    this.pexipAPI.makeCall(pexipNode, conferenceAlias, displayName, null);
  }
}
