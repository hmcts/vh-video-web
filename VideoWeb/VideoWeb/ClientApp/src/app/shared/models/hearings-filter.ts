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
    constructor(description: string, selected: boolean) {
        this.description = description;
        this.selected = selected;
    }

    description: string;
    selected: boolean;
}
export class StatusFilter extends ListFilter {
    constructor(description: string, status: ConferenceStatus | ExtendedConferenceStatus, selected: boolean) {
        super(description, selected);
        this.status = status;
    }

    status: ConferenceStatus | ExtendedConferenceStatus;
}

export class AlertFilter extends ListFilter {
    constructor(description: string, status: AlertsStatus, bodyText: string, selected: boolean) {
        super(description, selected);
        this.status = status;
        this.bodyText = bodyText;
    }

    status: AlertsStatus;
    bodyText: string;
}

export class ConferenceForUser extends ConferenceForVhOfficerResponse {
    constructor(conference: ConferenceForVhOfficerResponse) {
        super(conference);
        this.statusExtended = conference.status;
    }
    statusExtended: ConferenceStatus | ExtendedConferenceStatus;
}

export class HearingsFilter {
    statuses: StatusFilter[] = [];
    alerts: AlertFilter[] = [];
    numberFilterOptions = 0;
}
