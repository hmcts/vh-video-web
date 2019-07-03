import { Component, OnInit } from '@angular/core';
import { PageUrls } from 'src/app/shared/page-url.constants';
import { Router, ActivatedRoute } from '@angular/router';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { UpdateParticipantStatusEventRequest, ConferenceResponse } from 'src/app/services/clients/api-client';
import { AdalService } from 'adal-angular4';

@Component({
  selector: 'app-introduction',
  templateUrl: './introduction.component.html',
  styleUrls: ['./introduction.component.scss']
})
export class IntroductionComponent implements OnInit {
  conferenceId: string;
  conference: ConferenceResponse;

  constructor(private router: Router,
    private route: ActivatedRoute,
    private videoWebService: VideoWebService,
    private adalService: AdalService
  ) { }

  ngOnInit() {
    this.getConference();
    this.updateParticipantStatus();
  }

  getConference(): void {
    this.conferenceId = this.route.snapshot.paramMap.get('conferenceId');
    console.log(this.conferenceId);
/*     this.videoWebService.getConferenceById(this.conferenceId).subscribe(
      (conference) => {
        this.conference = conference;
        console.log(conference);
      }); */
  }

  updateParticipantStatus(): void {
/*     const participant = this.conference.participants.
      find(x => x.username.toLocaleLowerCase() === this.adalService.userInfo.userName.toLocaleLowerCase()); */

    this.videoWebService.raiseParticipantEvent(this.conferenceId,
      new UpdateParticipantStatusEventRequest({
        participant_id: '0D95D9B2-5CCB-451D-B9E6-20D62AC9D9D2'
      })).subscribe(x => { },
        (error) => {
          console.error(error);
        });
  }

  goToEquipmentCheck() {
    this.router.navigate([PageUrls.EquipmentCheck, this.conferenceId]);
  }
}
