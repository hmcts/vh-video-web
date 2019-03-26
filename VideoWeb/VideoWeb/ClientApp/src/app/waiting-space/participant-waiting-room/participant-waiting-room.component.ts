import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { VideoWebService } from 'src/app/services/video-web.service';
import { ConferenceResponse } from 'src/app/services/clients/api-client';

@Component({
  selector: 'app-participant-waiting-room',
  templateUrl: './participant-waiting-room.component.html',
  styleUrls: ['./participant-waiting-room.component.css']
})
export class ParticipantWaitingRoomComponent implements OnInit {

  loadingData: boolean;
  conference: ConferenceResponse;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private videoWebService: VideoWebService
  ) {
    this.loadingData = true;
  }

  ngOnInit() {
    this.getConference();
  }

  getConference(): void {
    const conferenceId = this.route.snapshot.paramMap.get('conferenceId');
    this.videoWebService.getConferenceById(conferenceId)
      .subscribe((data: ConferenceResponse) => {
        this.loadingData = false;
        this.conference = data;
      },
      () => {
        this.loadingData = false;
        this.router.navigate(['home']);
      });
  }

}
