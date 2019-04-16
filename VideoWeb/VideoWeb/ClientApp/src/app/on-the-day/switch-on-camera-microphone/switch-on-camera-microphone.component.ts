import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import 'webrtc-adapter';
import { PageUrls } from 'src/app/shared/page-url.constants';

@Component({
  selector: 'app-switch-on-camera-microphone',
  templateUrl: './switch-on-camera-microphone.component.html'
})
export class SwitchOnCameraMicrophoneComponent implements OnInit {

  mediaAccepted: boolean;
  userPrompted: boolean;
  conferenceId: string;

  _navigator = <any>navigator;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
  ) {
    this.userPrompted = false;
    this.mediaAccepted = false;
  }

  ngOnInit() {
    this.conferenceId = this.route.snapshot.paramMap.get('conferenceId');
    this._navigator = <any>navigator;
  }

  requestMedia() {
    const mediaConstraints = {
      video: { facingMode: 'user' },
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
    console.error(error);
  }

  goVideoTest() {
    // temporarily point to mic question until video page is implemented
    this.router.navigate([PageUrls.MicrophoneWorking, this.conferenceId]);
  }
}
