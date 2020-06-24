import { ConsultationAnswer } from '../clients/api-client';

export class ConsultationMessage {
    constructor(conferenceId: string, requestedBy: string, requestedFor: string, result?: ConsultationAnswer) {
        this.conferenceId = conferenceId;
        this.requestedBy = requestedBy;
        this.requestedFor = requestedFor;
        this.result = result;
    }

    conferenceId: string;
    requestedBy: string;
    requestedFor: string;
    result: ConsultationAnswer;
}
