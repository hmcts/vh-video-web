import { Component, OnInit } from '@angular/core';
import { ErrorService } from 'src/app/services/error.service';
import { Router, ActivatedRoute } from '@angular/router';
import { VideoWebService } from 'src/app/services/video-web.service';
import { ConferenceResponse, ParticipantResponse, TokenResponse } from 'src/app/services/clients/api-client';
import { AdalService } from 'adal-angular4';
import { PageUrls } from 'src/app/shared/page-url.constants';
import { merge, mergeMap, map } from 'rxjs/operators';
declare var PexRTC: any;

@Component({
  selector: 'app-self-test',
  templateUrl: './self-test.component.html',
  styleUrls: ['./self-test.component.css']
})
export class SelfTestComponent implements OnInit {

  loadingData: boolean;
  conference: ConferenceResponse;
  participant: ParticipantResponse;
  token: TokenResponse;
  pexipAPI: any;
  incomingStream: any;
  outgoingStream: any;

  testComplete: boolean;
  testScore: string;
  displayFeed: boolean;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private adalService: AdalService,
    private videoWebService: VideoWebService,
    private errorService: ErrorService,
  ) {
    this.testComplete = false;
  }

  ngOnInit() {
    this.displayFeed = false;
    this.getConference();
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

  setupPexipClient() {
    const self = this;
    this.pexipAPI = new PexRTC();

    this.pexipAPI.onSetup = function (stream, pin_status, conference_extension) {
      console.info('running pexip test call setup');
      self.outgoingStream = stream;
      this.connect('0000', null);
    };

    this.pexipAPI.onConnect = function (stream) {
      console.info('successfully connected');
      self.incomingStream = stream;
      self.displayFeed = true;
      self.mutedOutgoingVideo();
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

  call() {
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

  mutedOutgoingVideo() {
    const outgoingVideo = <HTMLVideoElement>document.getElementById('outgoingStream');
    outgoingVideo.muted = true;
  }
}
