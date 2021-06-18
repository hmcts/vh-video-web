import { ParticipantModel } from 'src/app/shared/models/participant';
import { RoomSummaryResponse } from '../../clients/api-client';
import { PexipDisplayNameModel } from './pexip-display-name.model';

export class VirtualMeetingRoomModel {
    public pexipDisplayName: PexipDisplayNameModel;
    constructor(
        public id: string,
        public displayName: string,
        public locked: boolean,
        public participants: ParticipantModel[] = [],
        public pexipId: string = null,
        pexipDisplayName: string | PexipDisplayNameModel = null
    ) {
        if (typeof pexipDisplayName === 'string') {
            this.pexipDisplayName = PexipDisplayNameModel.fromString(pexipDisplayName as string);
        } else {
            this.pexipDisplayName = pexipDisplayName;
        }
    }

    static fromRoomSummaryResponse(roomSummary: RoomSummaryResponse) {
        return new VirtualMeetingRoomModel(roomSummary.id, roomSummary.label, roomSummary.locked);
    }
}
