import { Component, EventEmitter, Input, OnInit, Output, OnDestroy } from '@angular/core';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { ConferenceResponse, ParticipantResponse, TokenResponse, TestCallScoreResponse } from 'src/app/services/clients/api-client';
import { ErrorService } from 'src/app/services/error.service';
import { Logger } from 'src/app/services/logging/logger-base';
import { UserMediaStreamService } from 'src/app/services/user-media-stream.service';
import { UserMediaService } from 'src/app/services/user-media.service';
import { SelectedUserMediaDevice } from '../../shared/models/selected-user-media-device';
import { Subscription } from 'rxjs';
declare var PexRTC: any;

@Component({
  selector: 'app-self-test',
  templateUrl: './self-test.component.html',
  styleUrls: ['./self-test.component.scss']
})
export class SelfTestComponent implements OnInit, OnDestroy {

  @Input() conference: ConferenceResponse;
  @Input() participant: ParticipantResponse;

  @Output() testStarted = new EventEmitter();
  @Output() testCompleted = new EventEmitter<TestCallScoreResponse>();

  token: TokenResponse;
  pexipAPI: any;
  incomingStream: MediaStream;
  outgoingStream: MediaStream;

  preferredMicrophoneStream: MediaStream;

  didTestComplete: boolean;
  displayFeed: boolean;

  displayDeviceChangeModal: boolean;
  hasMultipleDevices: boolean;

  testCallResult: TestCallScoreResponse = null;

  private maxBandwidth = 768;
  subscription: Subscription;

  constructor(
    private logger: Logger,
    private videoWebService: VideoWebService,
    private errorService: ErrorService,
    private userMediaService: UserMediaService,
    private userMediaStreamService: UserMediaStreamService
  ) {
    this.didTestComplete = false;
  }

  async ngOnInit() {
    this.logger.debug('loading self test');
    this.displayFeed = false;
    this.displayDeviceChangeModal = false;
    this.setupSubscribers();
    this.setupTestAndCall();
  }

  get streamsActive() {
    return this.outgoingStream && this.outgoingStream.active && this.incomingStream && this.incomingStream.active;
  }

  setupTestAndCall(): void {
    this.logger.debug('setting up pexip client and call');
    this.setupPexipClient();
    this.subscription = this.videoWebService.getToken(this.participant.id).subscribe((token: TokenResponse) => {
      this.logger.debug('retrieved token for self test');
      this.token = token;
      this.call();
    },
      (error) => {
        this.errorService.handleApiError(error);
      });
  }


  async changeDevices() {
    this.disconnect();
    this.userMediaStreamService.stopStream(this.preferredMicrophoneStream);
    this.displayDeviceChangeModal = true;
  }

  onMediaDeviceChangeCancelled() {
    this.displayDeviceChangeModal = false;
    this.call();
  }

  async onMediaDeviceChangeAccepted(selectedMediaDevice: SelectedUserMediaDevice) {
    this.displayDeviceChangeModal = false;
    this.userMediaService.updatePreferredCamera(selectedMediaDevice.selectedCamera);
    this.userMediaService.updatePreferredMicrophone(selectedMediaDevice.selectedMicrophone);
    await this.updatePexipAudioVideoSource();
    this.call();
  }

  setupSubscribers() {
    this.userMediaService.connectedDevices.subscribe(async (devices) => {
      this.hasMultipleDevices = await this.userMediaService.hasMultipleDevices();
    });
  }

  async updatePexipAudioVideoSource() {
    this.hasMultipleDevices = await this.userMediaService.hasMultipleDevices();

    const cam = await this.userMediaService.getPreferredCamera();
    if (cam) {
      this.pexipAPI.video_source = cam.deviceId;
    }

    const mic = await this.userMediaService.getPreferredMicrophone();
    if (mic) {
      this.pexipAPI.audio_source = mic.deviceId;
    }
    this.preferredMicrophoneStream = await this.userMediaStreamService.getStreamForMic(mic);
  }

  setupPexipClient() {
    const self = this;
    this.pexipAPI = new PexRTC();
    this.updatePexipAudioVideoSource();
    this.pexipAPI.onSetup = function (stream, pin_status, conference_extension) {
      self.logger.info('running pexip test call setup');
      self.outgoingStream = stream;
      this.connect('0000', null);
    };

    this.pexipAPI.onConnect = function (stream) {
      self.logger.info('successfully connected');
      self.incomingStream = stream;
      self.displayFeed = true;
      self.testStarted.emit();
    };

    this.pexipAPI.onError = function (reason) {
      self.displayFeed = false;
      self.logger.error('Error from pexip. Reason : ' + reason, reason);
      self.errorService.goToServiceError();
    };

    this.pexipAPI.onDisconnect = function (reason) {
      self.displayFeed = false;
      self.logger.info('Disconnected from pexip. Reason : ' + reason);
      if (reason === 'Conference terminated by another participant') {
        self.retrieveSelfTestScore();
      }
    };
  }

  async call() {
    this.didTestComplete = false;
    const pexipNode = this.conference.pexip_self_test_node_uri;
    const conferenceAlias = 'testcall2';
    const tokenOptions = btoa(`${this.token.expires_on};${this.participant.id};${this.token.token}`);
    this.pexipAPI.makeCall(pexipNode, `${conferenceAlias};${tokenOptions}`, this.participant.id, this.maxBandwidth);
  }

  replayVideo() {
    this.logger.debug('replaying self test video');
    this.disconnect();
    this.call();
  }

  disconnect() {
    if (this.pexipAPI) {
      this.logger.info('disconnecting from pexip node');
      this.pexipAPI.disconnect();
    }
    this.incomingStream = null;
    this.outgoingStream = null;
    this.didTestComplete = true;
    this.displayFeed = false;
  }

  async retrieveSelfTestScore() {
    this.logger.debug('retrieving self test score');
    this.didTestComplete = true;
    try {
      this.testCallResult = await this.videoWebService.getTestCallScore(this.conference.id, this.participant.id).toPromise();
      this.logger.info(`test call score: ${this.testCallResult.score}`);
    } catch (err) {
      this.logger.error('there was a problem retrieving the self test score', err);
    }
  }

  publishTestResult(): void {
    this.logger.info('test call completed');
    if (!this.didTestComplete) {
      this.disconnect();
    }
    this.testCompleted.emit(this.testCallResult);
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
    this.disconnect();
  }
}
