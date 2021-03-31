import * as moment from 'moment';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { translateServiceSpy } from 'src/app/testing/mocks/mock-translation.service';
import { HearingListTableComponent } from './hearing-list-table.component';

describe('HearingListTableComponent', () => {
    let component: HearingListTableComponent;
    const translateService = translateServiceSpy;
    const testData = new ConferenceTestData();

    beforeEach(() => {
        translateService.instant.calls.reset();
        component = new HearingListTableComponent(translateService);
        component.conferences = testData.getTestData();
    });

    it('should not show sign in when start time is more 30 minutes from start time', () => {
        const conference = new ConferenceTestData().getConferenceFuture();
        expect(component.canStartHearing(conference)).toBeFalsy();
    });

    it('should show sign in when start time is less than 30 minutes from start time', () => {
        const conference = new ConferenceTestData().getConferencePast();
        expect(component.canStartHearing(conference)).toBeTruthy();
    });

    it('should show sign in time as 30 minutes prior to scheduled date time', () => {
        const conference = new ConferenceTestData().getConferenceFuture();
        const result = component.getSignInTime(conference);
        const difference = moment(conference.scheduled_date_time).diff(moment(result), 'minutes');
        expect(difference).toBe(30);
    });

    it('should show sign in date as "Today" when conference is in the past', () => {
        const conference = new ConferenceTestData().getConferencePast();
        const result = component.getSignInDate(conference);
        expect(result).toBe('hearing-list-table.today');
    });

    it('should show sign in date as "Today" when conference is same date', () => {
        const conference = new ConferenceTestData().getConferenceNow();
        const result = component.getSignInDate(conference);
        expect(result).toBe('hearing-list-table.today');
    });

    it('should show sign in date when conference is in the future date', () => {
        const conference = new ConferenceTestData().getConferenceFuture();
        const result = component.getSignInDate(conference);

        // Assert
        const expectedDateString = moment(conference.scheduled_date_time).format('Do MMM');
        expect(translateService.instant).toHaveBeenCalledOnceWith('hearing-list-table.on-date', { date: expectedDateString });
        expect(result).toBe('hearing-list-table.on-date');
    });

    it('should emit conference selected', () => {
        spyOn(component.selectedConference, 'emit');
        const conference = new ConferenceTestData().getConferenceFuture();
        component.signIntoConference(conference);
        expect(component.selectedConference.emit).toHaveBeenCalledWith(conference);
    });
});
