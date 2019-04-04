import { ParticipantStatus } from '../clients/api-client';

export class ParticipantStatusMessage {
    constructor(email: string, status: ParticipantStatus) {
        this.email = email;
        this.status = status;
    }
    email: string;
    status: ParticipantStatus;
}
