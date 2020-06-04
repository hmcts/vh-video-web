import { Component, EventEmitter, Input, Output } from '@angular/core';
import * as moment from 'moment';
import { ConferenceForIndividualResponse } from 'src/app/services/clients/api-client';

@Component({
    selector: 'app-hearing-list-table',
    templateUrl: './hearing-list-table.component.html'
})
export class HearingListTableComponent {
    @Input() conferences: ConferenceForIndividualResponse[];
    @Output() selectedConference = new EventEmitter<ConferenceForIndividualResponse>();

    signIntoConference(conference: ConferenceForIndividualResponse) {
        this.selectedConference.emit(conference);
    }

    getSignInDate(conference: ConferenceForIndividualResponse): string {
        const today = moment.utc().dayOfYear();
        const scheduledDate = moment(conference.scheduled_date_time).utc().dayOfYear();

        if (today >= scheduledDate) {
            return 'Today';
        } else {
            const dateString = moment(conference.scheduled_date_time).format('Do MMM');
            return 'on ' + dateString;
        }
    }

    getSignInTime(conference: ConferenceForIndividualResponse): Date {
        return moment(conference.scheduled_date_time).subtract(30, 'minute').toDate();
    }

    canStartHearing(conference: ConferenceForIndividualResponse) {
        const currentDateTime = new Date(new Date().getTime());
        const difference = moment(conference.scheduled_date_time).diff(moment(currentDateTime), 'minutes');
        return difference < 30;
    }
}
