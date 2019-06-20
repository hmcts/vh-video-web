import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AdalService } from 'adal-angular4';
import { AddMediaEventRequest, ConferenceResponse } from 'src/app/services/clients/api-client';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { PageUrls } from 'src/app/shared/page-url.constants';
import 'webrtc-adapter';
import { UserMediaStreamService } from 'src/app/services/user-media-stream.service';

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

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private videoWebService: VideoWebService,
    private adalService: AdalService,
    private userMediaStreamService: UserMediaStreamService
  ) {
    this.userPrompted = false;
    this.mediaAccepted = false;
  }

  ngOnInit() {
    this.getConference();
  }

  getConference(): void {
    this.conferenceId = this.route.snapshot.paramMap.get('conferenceId');
    this.videoWebService.getConferenceById(this.conferenceId)
      .subscribe((conference) => this.conference = conference);
  }

  async requestMedia() {
    this.mediaAccepted = await this.userMediaStreamService.requestAccess();
    this.userPrompted = true;
    if (!this.mediaAccepted) {
      this.postPermissionDeniedAlert();
    }
  }

  goVideoTest() {
    this.router.navigate([PageUrls.SelfTestVideo, this.conferenceId]);
  }

  postPermissionDeniedAlert() {
    const participant = this.conference.participants.
      find(x => x.username.toLocaleLowerCase() === this.adalService.userInfo.userName.toLocaleLowerCase());
    this.videoWebService.raiseMediaEvent(this.conference.id,
      new AddMediaEventRequest({ participant_id: participant.id.toString() })).subscribe(x => { },
        (error) => {
          console.error(error);
        });
  }
}
