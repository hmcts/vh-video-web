import { Component, OnInit, NgZone } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import 'webrtc-adapter';
import { PageUrls } from 'src/app/shared/page-url.constants';
import { VideoWebService } from 'src/app/services/video-web.service';
import { ConferenceResponse, AddMediaEventRequest } from 'src/app/services/clients/api-client';
import { ErrorService } from 'src/app/services/error.service';
import { AdalService } from 'adal-angular4';

@Component({
  selector: 'app-switch-on-camera-microphone',
  templateUrl: './switch-on-camera-microphone.component.html'
})
export class SwitchOnCameraMicrophoneComponent implements OnInit {

  mediaAccepted: boolean;
  userPrompted: boolean;
  conferenceId: string;
  loadingData: boolean;
  conference: ConferenceResponse;

  _navigator = <any>navigator;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private videoWebService: VideoWebService,
    private errorService: ErrorService,
    private adalService: AdalService
  ) {
    this.userPrompted = false;
    this.mediaAccepted = false;
  }

  ngOnInit() {
    this.getConferenceId();
    this._navigator = <any>navigator;
  }

  getConferenceId(): void {
    this.conferenceId = this.route.snapshot.paramMap.get('conferenceId');
  }

  requestMedia() {
    const mediaConstraints = {
      video: true,
      audio: true
    };

    this._navigator.getUserMedia = (this._navigator.getUserMedia || this._navigator.webkitGetUserMedia
      || this._navigator.mozGetUserMedia || this._navigator.msGetUserMedia);

    this._navigator.mediaDevices
      .getUserMedia(mediaConstraints)
      .then(this.successCallback.bind(this), this.errorCallback.bind(this));
  }

  successCallback(stream: MediaStream) {
    this.userPrompted = true;
    this.mediaAccepted = true;
    const tracks = stream.getTracks();
    tracks.forEach(track => {
      track.stop();
    });

    this._navigator.mediaDevices.enumerateDevices()
      .then((mediaDevice) => {
        console.log(mediaDevice);
      });
  }

  errorCallback(error: MediaStreamError) {
    this.userPrompted = true;
    this.mediaAccepted = false;
    if (error.name === 'NotAllowedError') {
      this.postPermissionDeniedAlert();
    }
  }

  goVideoTest() {
    // temporarily point to camera question until video page is implemented
    console.log(PageUrls.CameraWorking);
    console.log(this.conferenceId);
    this.router.navigate([PageUrls.CameraWorking, this.conferenceId]);
  }

  postPermissionDeniedAlert() {
    const participant = this.conference.participants.find(x => x.username === this.adalService.userInfo.userName);
    this.videoWebService.raiseMediaEvent(this.conference.id,
      new AddMediaEventRequest({participant_id: participant.id.toString()})).subscribe(x => { },
        (error) => {
          console.error(error);
        });
  }
}
