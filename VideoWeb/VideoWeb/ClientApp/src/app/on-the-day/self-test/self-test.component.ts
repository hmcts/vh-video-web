import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AdalService } from 'adal-angular4';
import { ConferenceResponse, ParticipantResponse, TokenResponse } from 'src/app/services/clients/api-client';
import { ErrorService } from 'src/app/services/error.service';
import { UserMediaService } from 'src/app/services/user-media.service';
import { VideoWebService } from 'src/app/services/video-web.service';
import { PageUrls } from 'src/app/shared/page-url.constants';
import { SelectedUserMediaDevice } from '../models/selected-user-media-device';
declare var PexRTC: any;

@Component({
  selector: 'app-self-test',
  templateUrl: './self-test.component.html',
  styleUrls: ['./self-test.component.scss']
})
export class SelfTestComponent implements OnInit {

  loadingData: boolean;
  conference: ConferenceResponse;
  participant: ParticipantResponse;
  token: TokenResponse;
  pexipAPI: any;
  incomingStream: MediaStream;
  outgoingStream: MediaStream;

  preferredMicrophoneStream: MediaStream;

  testComplete: boolean;
  testScore: string;
  displayFeed: boolean;

  displayDeviceChangeModal: boolean;
  hasMultipleDevices: boolean;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private adalService: AdalService,
    private videoWebService: VideoWebService,
    private errorService: ErrorService,
    private userMediaService: UserMediaService
  ) {
    this.testComplete = false;
  }

  async ngOnInit() {
    this.displayFeed = false;
    this.displayDeviceChangeModal = false;
    this.getConference();
  }

  get streamsActive() {
    return this.outgoingStream && this.outgoingStream.active && this.incomingStream && this.incomingStream.active;
  }

  getConference(): void {
    const conferenceId = this.route.snapshot.paramMap.get('conferenceId');
    this.videoWebService.getConferenceById(conferenceId)
      .subscribe((data: ConferenceResponse) => {
        this.loadingData = false;
        this.conference = data;
        this.participant = data.participants.find(x => x.username.toLowerCase() === this.adalService.userInfo.userName.toLowerCase());
        this.setupPexipClient();
        this.videoWebService.getToken(this.participant.id).subscribe((token: TokenResponse) => {
          this.token = token;
          this.call();
        },
          (error) => {
            this.loadingData = false;
            this.errorService.handleApiError(error);
          });
      },
        (error) => {
          this.loadingData = false;
          this.errorService.handleApiError(error);
        });
  }

  async changeDevices() {
    this.disconnect();
    this.userMediaService.stopAStream(this.preferredMicrophoneStream);
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

  async updatePexipAudioVideoSource() {
    this.hasMultipleDevices = await this.userMediaService.hasMultipleDevices();

    if (this.userMediaService.getPreferredCamera()) {
      this.pexipAPI.video_source = this.userMediaService.getPreferredCamera().deviceId;
    }

    if (this.userMediaService.getPreferredMicrophone()) {
      this.pexipAPI.audio_source = this.userMediaService.getPreferredMicrophone().deviceId;
    }
    this.preferredMicrophoneStream = await this.userMediaService.getPreferredMicStream();
  }

  setupPexipClient() {
    const self = this;
    this.pexipAPI = new PexRTC();
    this.updatePexipAudioVideoSource();
    this.pexipAPI.onSetup = function (stream, pin_status, conference_extension) {
      console.info('running pexip test call setup');
      self.outgoingStream = stream;
      this.connect('0000', null);
    };

    this.pexipAPI.onConnect = function (stream) {
      console.info('successfully connected');
      self.incomingStream = stream;
      self.displayFeed = true;
    };

    this.pexipAPI.onError = function (reason) {
      self.displayFeed = false;
      console.warn('Error from pexip. Reason : ' + reason);
      self.errorService.goToServiceError();
    };

    this.pexipAPI.onDisconnect = function (reason) {
      self.displayFeed = false;
      console.info('Disconnected from pexip. Reason : ' + reason);
      if (reason === 'Conference terminated by another participant') {
        self.retrieveSelfTestScore();
      }
    };
  }

  async call() {
    this.testComplete = false;
    this.testScore = null;
    const pexipNode = this.conference.pexip_self_test_node_uri;
    const conferenceAlias = 'testcall2';
    const tokenOptions = btoa(`${this.token.expires_on};${this.participant.id};${this.token.token}`);
    this.pexipAPI.makeCall(pexipNode, `${conferenceAlias};${tokenOptions}`, this.participant.id, null);
  }

  replayVideo() {
    this.pexipAPI.disconnect();
    this.call();
  }

  disconnect() {
    this.pexipAPI.disconnect();
    this.incomingStream = null;
    this.outgoingStream = null;
    this.testComplete = true;
  }

  retrieveSelfTestScore() {
    this.testComplete = true;
    this.videoWebService.getTestCallScore(this.conference.id, this.participant.id)
      .toPromise()
      .then((testCallResult) => {
        this.testScore = testCallResult.score;
      });
  }

  onTestComplete() {
    if (!this.testComplete) {
      this.disconnect();
    }
    this.router.navigate([PageUrls.CameraWorking, this.conference.id]);
  }
}
