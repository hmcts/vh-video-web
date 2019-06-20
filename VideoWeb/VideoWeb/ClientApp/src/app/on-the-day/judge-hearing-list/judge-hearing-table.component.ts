import { Component, OnInit, Input } from '@angular/core';
import { ConferenceForUserResponse, ConferenceStatus } from 'src/app/services/clients/api-client';
import * as moment from 'moment';
import { Router } from '@angular/router';
import { PageUrls } from 'src/app/shared/page-url.constants';

@Component({
  selector: 'app-judge-hearing-table',
  templateUrl: './judge-hearing-table.component.html',
  styleUrls: ['./judge-hearing-table.component.scss']
})
export class JudgeHearingTableComponent implements OnInit {
  @Input() conferences: ConferenceForUserResponse[];

  constructor(private router: Router) { }

  ngOnInit() { }

  signIntoConference(conference: ConferenceForUserResponse) {
    this.router.navigate([PageUrls.JudgeWaitingRoom, conference.id]);
  }

  getSignInDate(conference: ConferenceForUserResponse): string {
    const today = moment.utc().dayOfYear();
    const scheduledDate = moment(conference.scheduled_date_time).utc().dayOfYear();
    if (today >= scheduledDate) {
      return 'Today';
    } else {
      const dateString = moment(conference.scheduled_date_time).format(
        'Do MMM'
      );
      return 'on ' + dateString;
    }
  }

  getSignInTime(conference: ConferenceForUserResponse): Date {
    return moment(conference.scheduled_date_time)
      .subtract(30, 'minute')
      .toDate();
  }

  canStartHearing(conference: ConferenceForUserResponse): boolean {
    const currentDateTime = new Date(new Date().getTime());
    const difference = moment(conference.scheduled_date_time).diff(
      moment(currentDateTime),
      'minutes'
    );
    return difference < 30;
  }

  hasAvailableParticipants(conference: ConferenceForUserResponse): boolean {
    return conference.no_of_participants_available > 0;
  }

  hasUnavailableParticipants(conference: ConferenceForUserResponse): boolean {
    return conference.no_of_participants_unavailable > 0;
  }

  hasInConsultationParticipants(conference: ConferenceForUserResponse): boolean {
    return conference.no_of_participants_in_consultation > 0;
  }

  isPausedOrSuspended(conference: ConferenceForUserResponse): boolean {
    return conference.status === ConferenceStatus.Paused || conference.status === ConferenceStatus.Suspended;
  }

  getDuration(duration: number): string {
    const h = Math.floor(duration / 60);
    const m = duration % 60;
    const hours = h < 1 ? `${h} hours` : `${h} hour`;
    const minutes = `${m} minutes`;
    if (h > 0) {
      return `${hours} and ${minutes}`;
    } else {
      return `${minutes}`;
    }
  }
}
