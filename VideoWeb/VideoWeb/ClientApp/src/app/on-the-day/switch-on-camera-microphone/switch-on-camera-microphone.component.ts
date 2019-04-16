import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import 'webrtc-adapter';
import { PageUrls } from 'src/app/shared/page-url.constants';

@Component({
  selector: 'app-switch-on-camera-microphone',
  templateUrl: './switch-on-camera-microphone.component.html',
  styleUrls: ['./switch-on-camera-microphone.component.css']
})
export class SwitchOnCameraMicrophoneComponent implements OnInit {

  mediaAccepted: boolean;
  userPrompted: boolean;
  conferenceId: string;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
  ) {
    this.userPrompted = false;
    this.mediaAccepted = false;
  }

  ngOnInit() {
    this.conferenceId = this.route.snapshot.paramMap.get('conferenceId');
  }

  requestMedia() {
    const mediaConstraints = {
      video: { facingMode: 'user' },
      audio: true
    };

    navigator.getUserMedia = (navigator.getUserMedia ||
      navigator.webkitGetUserMedia ||
      navigator.mozGetUserMedia ||
      navigator.msGetUserMedia);

    navigator.mediaDevices
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

    navigator.mediaDevices.enumerateDevices()
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
