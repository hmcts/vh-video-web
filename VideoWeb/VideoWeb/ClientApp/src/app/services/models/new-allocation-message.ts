export class NewAllocationMessage {
    constructor(hearingDetails: []) {
        this.hearingDetails = hearingDetails;
    }
    hearingDetails: Array<any>;
}
