export class ConsultationMessage {
    constructor(conferenceId: string, requestedBy: string, requestedFor: string, result: string) {
        this.conferenceId = conferenceId;
        this.requestedBy = requestedBy;
        this.requestedFor = requestedFor;
        this.result = result;
    }

    conferenceId: string;
    requestedBy: string;
    requestedFor: string;
    result: string;
}
