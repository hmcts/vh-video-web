import { ParticipantStatus } from '../clients/api-client';

export class ParticipantStatusMessage {
    constructor(
        public participantId: string,
        public username: string,
        public conferenceId: string,
        public status: ParticipantStatus
    ) {}
}
