import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import moment from 'moment';
import { ConferenceForIndividualResponse } from 'src/app/services/clients/api-client';
import { HearingVenueFlagsService } from 'src/app/services/hearing-venue-flags.service';

@Component({
    standalone: false,
    selector: 'app-hearing-list-table',
    templateUrl: './hearing-list-table.component.html'
})
export class HearingListTableComponent implements OnInit {
    @Input() conferences: ConferenceForIndividualResponse[];
    @Output() selectedConference = new EventEmitter<ConferenceForIndividualResponse>();

    constructor(
        private translate: TranslateService,
        private hearingVenueFlagsService: HearingVenueFlagsService
    ) {}

    ngOnInit() {
        this.hearingVenueFlagsService.setHearingVenueIsScottish(false);
    }

    signIntoConference(conference: ConferenceForIndividualResponse) {
        this.selectedConference.emit(conference);
    }

    getSignInDate(conference: ConferenceForIndividualResponse): string {
        const today = moment.utc().dayOfYear();
        const scheduledDate = moment(conference.scheduled_date_time).utc().dayOfYear();

        if (today >= scheduledDate) {
            return this.translate.instant('hearing-list-table.today');
        } else {
            const dateString = moment(conference.scheduled_date_time).format('Do MMM');
            return this.translate.instant('hearing-list-table.on-date', { date: dateString });
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
