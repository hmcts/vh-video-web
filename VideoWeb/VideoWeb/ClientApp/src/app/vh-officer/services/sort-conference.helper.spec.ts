import { sortConferencesForVhoOfficer } from './sort-conference.helper';
import { ConferenceForVhOfficerResponse, ConferenceStatus } from 'src/app/services/clients/api-client';

describe('sortConferencesForVhoOfficer', () => {
    it('should sort by scheduled datetime, then case name, then closed date time, and then case name', () => {
        const today = new Date();

        const conferenceEarlyMorningDupe1: ConferenceForVhOfficerResponse = {
            scheduled_date_time: new Date(today.getTime() + 8 * 60 * 60 * 1000),
            case_name: 'Case early morning A',
            status: ConferenceStatus.InSession
        } as ConferenceForVhOfficerResponse;

        const conferenceEarlyMorningDupe2: ConferenceForVhOfficerResponse = {
            scheduled_date_time: new Date(today.getTime() + 8 * 60 * 60 * 1000),
            case_name: 'Case early morning B',
            status: ConferenceStatus.NotStarted
        } as ConferenceForVhOfficerResponse;

        const conferenceMidMorning: ConferenceForVhOfficerResponse = {
            scheduled_date_time: new Date(today.getTime() + 10 * 60 * 60 * 1000),
            case_name: 'Case mid morning',
            status: ConferenceStatus.InSession
        } as ConferenceForVhOfficerResponse;

        const conferenceEarlyAfternoon: ConferenceForVhOfficerResponse = {
            scheduled_date_time: new Date(today.getTime() + 14 * 60 * 60 * 1000),
            case_name: 'Case early afternoon',
            status: ConferenceStatus.InSession
        } as ConferenceForVhOfficerResponse;

        const conferenceMidAfternoon: ConferenceForVhOfficerResponse = {
            scheduled_date_time: new Date(today.getTime() + 15 * 60 * 60 * 1000 + 10 * 60 * 1000),
            case_name: 'Case mid afternoon',
            status: ConferenceStatus.InSession
        } as ConferenceForVhOfficerResponse;

        const conferenceLateAfternoon: ConferenceForVhOfficerResponse = {
            scheduled_date_time: new Date(today.getTime() + 16 * 60 * 60 * 1000 + 40 * 60 * 1000),
            case_name: 'Case late afternoon',
            status: ConferenceStatus.NotStarted
        } as ConferenceForVhOfficerResponse;

        const conferenceLateMorningClosed: ConferenceForVhOfficerResponse = {
            scheduled_date_time: new Date(today.getTime() + 10 * 60 * 60 * 1000),
            case_name: 'Case late morning closed',
            status: ConferenceStatus.Closed,
            closed_date_time: new Date(today.getTime() + 10 * 60 * 60 * 1000)
        } as ConferenceForVhOfficerResponse;

        const conferenceEarlyAfternoonClosedDupe1: ConferenceForVhOfficerResponse = {
            scheduled_date_time: new Date(today.getTime() + 14 * 60 * 60 * 1000),
            case_name: 'Case early Afternoon closed A',
            status: ConferenceStatus.Closed,
            closed_date_time: new Date(today.getTime() + 15 * 60 * 60 * 1000)
        } as ConferenceForVhOfficerResponse;

        const conferenceEarlyAfternoonClosedDupe2: ConferenceForVhOfficerResponse = {
            scheduled_date_time: new Date(today.getTime() + 14 * 60 * 60 * 1000 + 40 * 60 * 1000),
            case_name: 'Case early Afternoon closed B',
            status: ConferenceStatus.Closed,
            closed_date_time: new Date(today.getTime() + 15 * 60 * 60 * 1000)
        } as ConferenceForVhOfficerResponse;

        const conferenceLateAfternoonClosed: ConferenceForVhOfficerResponse = {
            scheduled_date_time: new Date(today.getTime() + 16 * 60 * 60 * 1000 + 40 * 60 * 1000),
            case_name: 'Case late afternoon Closed',
            status: ConferenceStatus.Closed,
            closed_date_time: new Date(today.getTime() + 18 * 60 * 60 * 1000)
        } as ConferenceForVhOfficerResponse;

        const conferences: ConferenceForVhOfficerResponse[] = [
            conferenceEarlyAfternoonClosedDupe1,
            conferenceEarlyMorningDupe1,
            null,
            conferenceEarlyAfternoonClosedDupe2,
            conferenceMidAfternoon,
            conferenceMidMorning,
            conferenceLateAfternoonClosed,
            conferenceLateMorningClosed,
            conferenceEarlyAfternoon,
            conferenceLateAfternoon,
            conferenceEarlyMorningDupe2,
            null
        ];

        const sortedConferences = sortConferencesForVhoOfficer(conferences);

        const expected: ConferenceForVhOfficerResponse[] = [
            null,
            null,
            conferenceEarlyMorningDupe1,
            conferenceEarlyMorningDupe2,
            conferenceMidMorning,
            conferenceEarlyAfternoon,
            conferenceMidAfternoon,
            conferenceLateAfternoon,
            conferenceLateMorningClosed,
            conferenceEarlyAfternoonClosedDupe1,
            conferenceEarlyAfternoonClosedDupe2,
            conferenceLateAfternoonClosed
        ];

        expect(sortedConferences).toEqual(expected);
    });
});
