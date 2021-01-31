import { ParticipantResponse } from 'src/app/services/clients/api-client';

export class ParticipantResponseExtend extends ParticipantResponse {
    constructor(participant: ParticipantResponse) {
        super(participant);
    }

    canCallParticipant: boolean;
}
