import { ConsultationAnswer } from '../clients/api-client';

export class ConsultationRequestResponseMessage {
    constructor(conferenceId: string, roomLabel: string, requestedFor: string, answer?: ConsultationAnswer, responseInitiatorId?: string) {
        this.conferenceId = conferenceId;
        this.roomLabel = roomLabel;
        this.requestedFor = requestedFor;
        this.answer = answer;
        this.responseInitiatorId = responseInitiatorId;
    }

    conferenceId: string;
    roomLabel: string;
    requestedFor: string;
    answer: ConsultationAnswer;
    responseInitiatorId: string;
}
