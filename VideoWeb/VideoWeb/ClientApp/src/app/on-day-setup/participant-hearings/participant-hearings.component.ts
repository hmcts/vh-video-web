import { Component, OnInit } from '@angular/core';
import { ConferenceForUserResponse } from 'src/app/services/clients/api-client';
import { VideoWebService } from 'src/app/services/video-web.service';
import * as moment from 'moment';

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
    console.log('on hearing list');
    this.retrieveHearingsForUser();
  }

  retrieveHearingsForUser() {
    this.videoWebService.getConferencesForUser().subscribe((data: ConferenceForUserResponse[]) => {
      this.conferences = data;
    });
  }

  hasHearings() {
    return this.conferences !== undefined && this.conferences.length > 0;
  }

  goToConference(conference: ConferenceForUserResponse) {
    // TODO: implement
  }

  canStartHearing(conference: ConferenceForUserResponse) {
    const currentDateTime = new Date(new Date().getTime());
    const difference = moment(conference.scheduled_date_time).diff(moment(currentDateTime), 'minutes');
    return difference < 30;
  }
}
