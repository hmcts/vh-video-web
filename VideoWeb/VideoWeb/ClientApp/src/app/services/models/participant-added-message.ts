import { ParticipantResponse } from '../clients/api-client';

export class ParticipantAddedMessage {
    constructor(conferenceId: string, participant: ParticipantResponse) {
        this.conferenceId = conferenceId;
        this.participant = participant;
    }
    conferenceId: string;
    participant: ParticipantResponse;
}
