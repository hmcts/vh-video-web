import { Component, OnInit, Input } from '@angular/core';
import { ConferenceForUserResponse } from 'src/app/services/clients/api-client';
import * as moment from 'moment';
import { Router } from '@angular/router';

@Component({
  selector: 'app-hearing-list-table',
  templateUrl: './hearing-list-table.component.html',
  styleUrls: ['./hearing-list-table.component.css']
})
export class HearingListTableComponent implements OnInit {
  @Input() conferences: ConferenceForUserResponse[];

  constructor(private router: Router) { }

  ngOnInit() {
  }

  signIntoConference(conference: ConferenceForUserResponse) {
    this.router.navigate(['/equipment-check', conference.id]);
  }

  getSignInDate(conference: ConferenceForUserResponse): string {
    const today = moment.utc().dayOfYear();
    const scheduledDate = moment(conference.scheduled_date_time).dayOfYear();

    if (today >= scheduledDate) {
      return 'Today';
    } else {
      const dateString = moment(conference.scheduled_date_time).format('Do MMM');
      return 'on ' + dateString;
    }
  }

  getSignInTime(conference: ConferenceForUserResponse): Date {
    return moment(conference.scheduled_date_time).subtract(30, 'minute').toDate();
  }

  canStartHearing(conference: ConferenceForUserResponse) {
    const currentDateTime = new Date(new Date().getTime());
    const difference = moment(conference.scheduled_date_time).diff(moment(currentDateTime), 'minutes');
    return difference < 30;
  }

}
