export class EventStatusModel {
    constructor(conferenceId: string, participantId: string) {
        this.ConferenceId = conferenceId;
        this.ParticipantId = participantId;
    }

    ConferenceId: string;
    ParticipantId: string;
}
