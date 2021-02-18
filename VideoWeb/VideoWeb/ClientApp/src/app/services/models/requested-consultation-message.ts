export class RequestedConsultationMessage {
    constructor(conferenceId: string, roomLabel: string, requestedBy: string, requestedFor: string) {
        this.conferenceId = conferenceId;
        this.requestedBy = requestedBy;
        this.requestedFor = requestedFor;
        this.roomLabel = roomLabel;
    }

    conferenceId: string;
    roomLabel: string;
    requestedBy: string;
    requestedFor: string;
}
