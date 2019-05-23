import { Component, OnInit } from '@angular/core';
import { ErrorService } from 'src/app/services/error.service';
import { Router, ActivatedRoute } from '@angular/router';
import { VideoWebService } from 'src/app/services/video-web.service';
import { ConferenceResponse, ParticipantResponse } from 'src/app/services/clients/api-client';
import { AdalService } from 'adal-angular4';
import { throwError } from 'rxjs';
import { PageUrls } from 'src/app/shared/page-url.constants';
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
        this.call();
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
      self.displayFeed = true;
      self.incomingStream = stream;
    };

    this.pexipAPI.onError = function (reason) {
      self.displayFeed = false;
      console.warn('Error from pexip. Reason : ' + reason);
      // self.errorService.goToServiceError();
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
    const pexipNode = this.conference.pexip_self_test_node_uri;
    const conferenceAlias = 'testcall2';
    this.pexipAPI.makeCall(pexipNode, conferenceAlias, this.participant.id, null);
  }

  replayVideo() {
    this.call();
  }

  disconnect() {
    this.pexipAPI.disconnect();
    this.testComplete = true;
  }

  retrieveSelfTestScore() {
    this.testComplete = true;
    throwError('Not implemented exception');
  }

  goToCameraWorking() {
    if (!this.testComplete) {
      this.disconnect();
    }
    this.router.navigate([PageUrls.CameraWorking, this.conference.id]);
  }
}
