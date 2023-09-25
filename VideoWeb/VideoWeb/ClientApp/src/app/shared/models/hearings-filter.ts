import { ConferenceStatus, ConferenceForVhOfficerResponse } from 'src/app/services/clients/api-client';

export enum AlertsStatus {
    Disconnected = 'Disconnected',
    FailedSelfTest = 'FailedSelfTest',
    MediaBlocked = 'MediaBlocked',
    Suspended = 'Suspended'
}

export enum ExtendedConferenceStatus {
    Delayed = 'Delayed'
}
export class ListFilter {
    constructor(public description: string, public selected: boolean) {}
}
export class StatusFilter extends ListFilter {
    constructor(public description: string, public status: ConferenceStatus | ExtendedConferenceStatus, public selected: boolean) {
        super(description, selected);
    }
}

export class AlertFilter extends ListFilter {
    constructor(public description: string, public status: AlertsStatus, public bodyText: string, public selected: boolean) {
        super(description, selected);
    }
}

export class ConferenceForUser extends ConferenceForVhOfficerResponse {
    statusExtended: ConferenceStatus | ExtendedConferenceStatus;

    constructor(conference: ConferenceForVhOfficerResponse) {
        super(conference);
        this.statusExtended = conference.status;
    }
}

export class HearingsFilter {
    statuses: StatusFilter[] = [];
    alerts: AlertFilter[] = [];
    numberFilterOptions = 0;
}
