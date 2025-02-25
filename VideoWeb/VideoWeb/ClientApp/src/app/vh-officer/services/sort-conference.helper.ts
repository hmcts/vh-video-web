import { ConferenceForVhOfficerResponse } from 'src/app/services/clients/api-client';

/**
 * Based on the implementation of the sortConferencesForVhOfficer.cs.
 * @param conferences List of conferences
 * @returns ordered list of conferences
 */
export function sortConferencesForVhoOfficer(conferences: ConferenceForVhOfficerResponse[]): ConferenceForVhOfficerResponse[] {
    return conferences.sort((x, y) => {
        if (x === y) {
            return 0;
        }
        if (y === null) {
            return 1;
        }
        if (x === null) {
            return -1;
        }

        const conferenceStatusCompare = compareStatus(x, y);
        if (conferenceStatusCompare !== 0) {
            return conferenceStatusCompare;
        }

        if (x.status === 'Closed' && y.status === 'Closed') {
            return compareClosedConference(x, y);
        }

        return compareNonClosedConference(x, y);
    });
}

function compareNonClosedConference(x: ConferenceForVhOfficerResponse, y: ConferenceForVhOfficerResponse): number {
    if (x.scheduled_date_time.getTime() === y.scheduled_date_time.getTime()) {
        return x.case_name.localeCompare(y.case_name);
    }

    return x.scheduled_date_time.getTime() > y.scheduled_date_time.getTime() ? 1 : -1;
}

function compareClosedConference(x: ConferenceForVhOfficerResponse, y: ConferenceForVhOfficerResponse): number {
    if (x.closed_date_time.getTime() === y.closed_date_time.getTime()) {
        return x.case_name.localeCompare(y.case_name);
    }

    return x.closed_date_time.getTime() > y.closed_date_time.getTime() ? 1 : -1;
}

function compareStatus(x: ConferenceForVhOfficerResponse, y: ConferenceForVhOfficerResponse): number {
    if (x.status === 'Closed' && y.status !== 'Closed') {
        return 1;
    }

    if (y.status === 'Closed' && x.status !== 'Closed') {
        return -1;
    }

    return 0;
}
