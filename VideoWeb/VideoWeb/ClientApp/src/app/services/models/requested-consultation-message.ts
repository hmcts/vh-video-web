export class RequestedConsultationMessage {
    constructor(public conferenceId: string, public invitationId : string, public roomLabel: string, public requestedBy: string, public requestedFor: string) {}
}
