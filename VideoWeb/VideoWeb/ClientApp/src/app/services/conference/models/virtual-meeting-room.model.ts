import { ParticipantModel } from 'src/app/shared/models/participant';
import { RoomSummaryResponse } from '../../clients/api-client';

export class VirtualMeetingRoomModel {
    constructor(public id: string, public displayName: string, public locked: boolean, public participants: ParticipantModel[] = []) {}

    static fromRoomSummaryResponse(roomSummary: RoomSummaryResponse) {
        return new VirtualMeetingRoomModel(roomSummary.id, roomSummary.label, roomSummary.locked);
    }
}
