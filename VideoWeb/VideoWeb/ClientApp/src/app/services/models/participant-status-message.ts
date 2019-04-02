export class ParticipantStatusMessage {
    constructor(email: string, status: string) {
        this.email = email;
        this.status = status;
    }
    email: string;
    status: string;
}
