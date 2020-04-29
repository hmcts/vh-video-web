import { ParticipantStatus } from '../clients/api-client';

export class ParticipantStatusMessage {
    constructor(participantId: string, username: string, conferenceId: string, status: ParticipantStatus) {
        this.participantId = participantId;
        this.username = username;
        this.conferenceId = conferenceId;
        this.status = status;
    }
    participantId: string;
    username: string;
    conferenceId: string;
    status: ParticipantStatus;
}
