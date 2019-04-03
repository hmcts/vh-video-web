export class HearingStatusMessage {
    constructor(conferenceId: string, status: string) {
        this.conferenceId = conferenceId;
        this.status = status;
    }
    conferenceId: string;
    status: string;
}
