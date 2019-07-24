import { Component, NgZone, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AdalService } from 'adal-angular4';
import { ConferenceResponse, ConferenceStatus, ParticipantResponse, ParticipantStatus } from 'src/app/services/clients/api-client';
import { ParticipantStatusMessage } from 'src/app/services/models/participant-status-message';
import { EventsService } from 'src/app/services/events.service';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { ConferenceStatusMessage } from 'src/app/services/models/conference-status-message';
import { ErrorService } from 'src/app/services/error.service';
import { ClockService as ClockService } from 'src/app/services/clock.service';
import { Hearing } from '../../shared/models/hearing';
import { UserMediaService } from 'src/app/services/user-media.service';
import { Logger } from 'src/app/services/logging/logger-base';
declare var PexRTC: any;

@Component({
  selector: 'app-participant-waiting-room',
  templateUrl: './participant-waiting-room.component.html',
  styleUrls: ['./participant-waiting-room.component.scss']
})
export class ParticipantWaitingRoomComponent implements OnInit {

  loadingData: boolean;
  hearing: Hearing;
  participant: ParticipantResponse;

  pexipAPI: any;
  stream: MediaStream;
  connected: boolean;

  currentTime: Date;
  hearingStartingAnnounced: boolean;
  currentPlayCount: number;
  hearingAlertSound: HTMLAudioElement;

  showVideo: boolean;

  constructor(
    private route: ActivatedRoute,
    private videoWebService: VideoWebService,
    private eventService: EventsService,
    private ngZone: NgZone,
    private adalService: AdalService,
    private errorService: ErrorService,
    private clockService: ClockService,
    private userMediaService: UserMediaService,
    private logger: Logger
  ) {
    this.loadingData = true;
    this.showVideo = false;
  }

  ngOnInit() {
    this.logger.debug('Loading participant waiting room');
    this.connected = false;
    this.initHearingAlert();
    this.getConference();
  }

  initHearingAlert() {
    this.hearingStartingAnnounced = false;
    this.currentPlayCount = 1;

    this.hearingAlertSound = new Audio();
    this.hearingAlertSound.src = '/assets/audio/hearing_starting_soon.mp3';
    this.hearingAlertSound.load();
    const self = this;
    this.hearingAlertSound.addEventListener('ended', function () {
      self.currentPlayCount++;
      if (self.currentPlayCount <= 3) {
        this.play();
      }
    }, false);
  }

  subscribeToClock(): void {
    this.clockService.getClock().subscribe((time) => {
      this.currentTime = time;
      this.checkIfHearingIsStarting();
    });
  }

  checkIfHearingIsStarting(): void {
    if (this.hearing.isStarting() && !this.hearingStartingAnnounced) {
      this.announceHearingIsAboutToStart();
    }
  }

  announceHearingIsAboutToStart(): void {
    this.hearingAlertSound.play()
      .catch(function (reason) {
        console.error(`caught error ${reason}`);
      });
    this.hearingStartingAnnounced = true;
  }

  getConference(): void {
    const conferenceId = this.route.snapshot.paramMap.get('conferenceId');
    this.videoWebService.getConferenceById(conferenceId)
      .subscribe(async (data: ConferenceResponse) => {
        this.loadingData = false;
        this.hearing = new Hearing(data);
        this.participant = data.participants.find(x => x.username.toLowerCase() === this.adalService.userInfo.userName.toLowerCase());
        this.logger.info(`Participant waiting room for conference: ${conferenceId} and participant: ${this.participant.id}`);
        this.subscribeToClock();
        this.setupSubscribers();
        await this.setupPexipClient();
        this.call();
      },
        (error) => {
          this.logger.error(`There was an error getting a confernce ${conferenceId}`, error);
          this.loadingData = false;
          this.errorService.handleApiError(error);
        });
  }

  getConferenceStatusText(): string {
    if (this.hearing.getConference().status === ConferenceStatus.NotStarted) {
      if (this.hearing.isStarting()) {
        return 'is about to begin';
      } else if (this.hearing.isDelayed()) {
        return 'is delayed';
      } else {
        return '';
      }
    } else if (this.hearing.isSuspended()) {
      return 'is suspended';
    } else if (this.hearing.isPaused()) {
      return 'is paused';
    } else if (this.hearing.isClosed()) {
      return 'is closed';
    }
    return 'is in session';
  }

  private setupSubscribers() {
    this.eventService.start();

    this.logger.debug('Subscribing to conference status changes...');
    this.eventService.getHearingStatusMessage().subscribe(message => {
      this.ngZone.run(() => {
        this.handleConferenceStatusChange(message);
        this.updateShowVideo();
      });
    });

    this.logger.debug('Subscribing to participant status changes...');
    this.eventService.getParticipantStatusMessage().subscribe(message => {
      this.ngZone.run(() => {
        this.handleParticipantStatusChange(message);
        this.updateShowVideo();
      });
    });
  }

  handleParticipantStatusChange(message: ParticipantStatusMessage): any {
    const participant = this.hearing.getConference().participants.find(p => p.username.toLowerCase() === message.email.toLowerCase());
    participant.status = message.status;
  }

  handleConferenceStatusChange(message: ConferenceStatusMessage) {
    this.hearing.getConference().status = message.status;
  }

  async setupPexipClient() {
    this.logger.debug('Setting up pexip client...');
    const self = this;
    this.pexipAPI = new PexRTC();

    const preferredCam = await this.userMediaService.getPreferredCamera();
    if (preferredCam) {
      this.pexipAPI.video_source = preferredCam.deviceId;
      self.logger.info(`Using preferred camera: ${preferredCam.label}`);
    }

    const preferredMic = await this.userMediaService.getPreferredMicrophone();
    if (preferredMic) {
      this.pexipAPI.audio_source = preferredMic.deviceId;
      self.logger.info(`Using preferred microphone: ${preferredMic.label}`);
    }

    this.pexipAPI.onSetup = function (stream, pin_status, conference_extension) {
      self.logger.info('running pexip setup');
      this.connect('0000', null);
    };

    this.pexipAPI.onConnect = function (stream) {
      self.connected = true;
      self.updateShowVideo();
      self.logger.info('successfully connected to call');
      self.stream = stream;
    };

    this.pexipAPI.onError = function (reason) {
      self.connected = false;
      self.updateShowVideo();
      self.logger.error(`Error from pexip. Reason : ${reason}`, reason);
      self.errorService.goToServiceError();
    };

    this.pexipAPI.onDisconnect = function (reason) {
      self.connected = false;
      self.updateShowVideo();
      self.logger.info(`Disconnected from pexip. Reason : ${reason}`);
    };
  }

  call() {
    const pexipNode = this.hearing.getConference().pexip_node_uri;
    const conferenceAlias = this.hearing.getConference().participant_uri;
    const displayName = this.participant.tiled_display_name;
    this.logger.debug(`Calling ${pexipNode} - ${conferenceAlias} as ${displayName}`);
    this.pexipAPI.makeCall(pexipNode, conferenceAlias, displayName, null);
  }

  updateShowVideo(): void {
    if (!this.connected) {
      this.logger.debug('Not showing video because not connecting to node');
      this.showVideo = false;
      return;
    }

    if (this.hearing.isInSession()) {
      this.logger.debug('Showing video because hearing is in session');
      this.showVideo = true;
      return;
    }

    if (this.participant.status === ParticipantStatus.InConsultation) {
      this.logger.debug('Showing video because hearing is in session');
      this.showVideo = true;
      return;
    }

    this.logger.debug('Not showing video because hearing is not in session and user is not in consultation');
    this.showVideo = false;
  }
}
