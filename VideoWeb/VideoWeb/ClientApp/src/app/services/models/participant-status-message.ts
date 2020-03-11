import { ParticipantStatus } from '../clients/api-client';

export class ParticipantStatusMessage {
    constructor(participantId: string, status: ParticipantStatus) {
        this.participantId = participantId;
        this.status = status;
    }
    participantId: string;
    status: ParticipantStatus;
}
