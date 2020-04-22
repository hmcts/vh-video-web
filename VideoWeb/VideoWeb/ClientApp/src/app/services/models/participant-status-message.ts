import { ParticipantStatus } from '../clients/api-client';

export class ParticipantStatusMessage {
    constructor(participantId: string, conferenceId: string, status: ParticipantStatus) {
        this.participantId = participantId;
        this.conferenceId = conferenceId;
        this.status = status;
    }
    participantId: string;
    conferenceId: string;
    status: ParticipantStatus;
}
