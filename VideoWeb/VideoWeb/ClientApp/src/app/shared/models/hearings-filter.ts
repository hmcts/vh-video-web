import { ConferenceStatus, ConferenceForUserResponse } from 'src/app/services/clients/api-client';

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
        this.Description = description;
        this.Selected = selected;
    }

    Description: string;
    Selected: boolean;
}
export class StatusFilter extends ListFilter {

    constructor(description: string, status: ConferenceStatus | ExtendedConferenceStatus, selected: boolean) {
        super(description, selected);
        this.Status = status;
    }

    Status: ConferenceStatus | ExtendedConferenceStatus;
}

export class AlertFilter extends ListFilter {

    constructor(description: string, status: AlertsStatus, bodyText: string, selected: boolean) {
        super(description, selected);
        this.Status = status;
        this.BodyText = bodyText;
    }

    Status: AlertsStatus;
    BodyText: string;
}

export class ConferenceForUser extends ConferenceForUserResponse {
    constructor(conference: ConferenceForUserResponse) {
        super(conference);
        this.StatusExtended = conference.status;
    }
    StatusExtended: ConferenceStatus | ExtendedConferenceStatus;
}

export class HearingsFilter {
    statuses: StatusFilter[] = [];
    locations: ListFilter[] = [];
    alerts: AlertFilter[] = [];
    numberFilterOptions = 0;
}
