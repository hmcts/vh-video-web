import { RoomType } from '../clients/api-client';

export class AdminConsultationMessage {
    constructor(conferenceId: string, roomType: RoomType, requestedFor: string) {
        this.conferenceId = conferenceId;
        this.roomType = roomType;
        this.requestedFor = requestedFor;
    }

    conferenceId: string;
    roomType: RoomType;
    requestedFor: string;
}
