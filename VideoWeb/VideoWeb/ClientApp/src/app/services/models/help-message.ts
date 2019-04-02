export class HelpMessage {
    constructor(conferenceId: string, participantName: string) {
        this.conferenceId = conferenceId;
        this.participantName = participantName;
    }
    conferenceId: string;
    participantName: string;
}
