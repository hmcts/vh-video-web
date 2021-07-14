import { ParticipantResponse } from 'src/app/services/clients/api-client';

export class ParticipantsUpdatedMessage {
    constructor(public conferenceId: string, public participants: ParticipantResponse[]) {}
}
