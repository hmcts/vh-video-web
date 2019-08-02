import { ConsultationAnswer } from 'src/app/services/clients/api-client';

export class ConsultationResponse {
    conferenceId: string;
    requestedBy: string;
    requestedFor: string;
    answer: ConsultationAnswer;

    constructor(conferenceId: string, requestedBy: string, requestedFor: string, answer: ConsultationAnswer) {
        this.conferenceId = conferenceId;
        this.requestedBy = requestedBy;
        this.requestedFor = requestedFor;
        this.answer = answer;
    }
}
