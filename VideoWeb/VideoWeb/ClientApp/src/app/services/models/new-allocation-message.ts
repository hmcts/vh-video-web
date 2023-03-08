import { HearingDetailRequest } from '../clients/api-client';

export class NewAllocationMessage {
    constructor(hearingDetails: HearingDetailRequest[]) {
        this.hearingDetails = hearingDetails;
    }
    hearingDetails: HearingDetailRequest[];
}
