import { Component, OnInit } from '@angular/core';
import { ConferenceForUserResponse } from 'src/app/services/clients/api-client';
import { VideoWebService } from 'src/app/services/video-web.service';

@Component({
  selector: 'app-participant-hearings',
  templateUrl: './participant-hearings.component.html',
  styleUrls: ['./participant-hearings.component.css']
})
export class ParticipantHearingsComponent implements OnInit {

  conferences: ConferenceForUserResponse[];
  loadingData: boolean;

  constructor(private videoWebService: VideoWebService) {
    this.loadingData = true;
  }

  ngOnInit() {
    this.retrieveHearingsForUser();
  }

  retrieveHearingsForUser() {
    this.videoWebService.getConferencesForUser().subscribe((data: ConferenceForUserResponse[]) => {
      this.loadingData = false;
      this.conferences = data;
    });
  }

  hasHearings() {
    return this.conferences !== undefined && this.conferences.length > 0;
  }
}
