import { ConsultationAnswer } from '../clients/api-client';

export class ConsultationRequestResponseMessage {
    constructor(public conferenceId: string, public invitationId, public roomLabel: string, public requestedFor: string, public answer?: ConsultationAnswer, public responseInitiatorId?: string) {}
}
