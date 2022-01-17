export class NewConferenceAddedMessage {
    constructor(conferenceId: string) {
        this.conferenceId = conferenceId;
    }
    conferenceId: string;
}
