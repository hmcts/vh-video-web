import { ConferenceStatus } from '../clients/api-client';

export class ConferenceStatusMessage {
    constructor(conferenceId: string, status: ConferenceStatus) {
        this.conferenceId = conferenceId;
        this.status = status;
    }
    conferenceId: string;
    status: ConferenceStatus;
}
