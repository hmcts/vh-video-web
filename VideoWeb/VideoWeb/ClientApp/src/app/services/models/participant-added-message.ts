import { ParticipantResponse } from '../clients/api-client';

export class ParticipantAddedMessage {
    constructor(
        public conferenceId: string,
        public participant: ParticipantResponse
    ) {}
}
