export class EventStatusModel {
    constructor(conferenceId: string, participantId: string) {
        this.conferenceId = conferenceId;
        this.participantId = participantId;
    }

    conferenceId: string;
    participantId: string;
}
