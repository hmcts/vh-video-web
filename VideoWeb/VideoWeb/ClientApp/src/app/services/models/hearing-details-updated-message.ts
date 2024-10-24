import { ConferenceResponse } from '../clients/api-client';

export class HearingDetailsUpdatedMessage {
    constructor(public conference: ConferenceResponse) {}
}
