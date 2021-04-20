import { ConsultationAnswer } from '../clients/api-client';

export class ConsultationRequestResponseMessage {
    constructor(conferenceId: string, roomLabel: string, requestedFor: string, answer?: ConsultationAnswer, sentByClient?: boolean) {
        this.conferenceId = conferenceId;
        this.roomLabel = roomLabel;
        this.requestedFor = requestedFor;
        this.answer = answer;
        this.sentByClient = sentByClient;
    }

    conferenceId: string;
    roomLabel: string;
    requestedFor: string;
    answer: ConsultationAnswer;
    sentByClient: boolean;
}
