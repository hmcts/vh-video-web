import { RoomType, ConsultationAnswer } from '../clients/api-client';

export class AdminConsultationMessage {
    constructor(conferenceId: string, roomType: RoomType, requestedFor: string, answer: ConsultationAnswer) {
        this.conferenceId = conferenceId;
        this.roomType = roomType;
        this.requestedFor = requestedFor;
        this.answer = answer;
    }

    conferenceId: string;
    roomType: RoomType;
    requestedFor: string;
    answer: ConsultationAnswer;
}
