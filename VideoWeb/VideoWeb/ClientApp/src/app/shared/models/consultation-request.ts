export class ConsultationRequest {
    conferenceId: string;
    requestedBy: string;
    requestedFor: string;

    constructor(conferenceId: string, requestedBy: string, requestedFor: string) {
        this.conferenceId = conferenceId;
        this.requestedBy = requestedBy;
        this.requestedFor = requestedFor;
    }
}
