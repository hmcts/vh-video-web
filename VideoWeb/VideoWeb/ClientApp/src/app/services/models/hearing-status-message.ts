export class HearingStatusMessage {
    constructor(hearingId: number, status: string) {
        this.hearingId = hearingId;
        this.status = status;
    }
    hearingId: number;
    status: string;
}
