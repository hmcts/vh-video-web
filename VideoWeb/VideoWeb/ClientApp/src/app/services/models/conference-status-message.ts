import { ConferenceStatus } from '../clients/api-client';

export class ConferenceStatusMessage {
    constructor(public conferenceId: string, public status: ConferenceStatus) {}
}
