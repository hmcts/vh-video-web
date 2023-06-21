import { HearingDetailRequest } from '../clients/api-client';

export class NewAllocationMessage {
    constructor(public hearingDetails: HearingDetailRequest[]) {}
}
