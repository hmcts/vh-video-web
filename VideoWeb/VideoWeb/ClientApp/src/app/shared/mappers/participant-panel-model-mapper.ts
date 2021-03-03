import { ParticipantForUserResponse, RoomSummaryResponse } from 'src/app/services/clients/api-client';
import { LinkedParticipantPanelModel } from 'src/app/waiting-space/models/linked-participant-panel-model';
import { PanelModel } from 'src/app/waiting-space/models/panel-model-base';
import { ParticipantPanelModel } from 'src/app/waiting-space/models/participant-panel-model';

export class ParticipantPanelModelMapper {
    mapFromParticipantUserResponse(pats: ParticipantForUserResponse[]): PanelModel[] {
        const participants: PanelModel[] = [];
        pats.forEach(x => {
            if (x.linked_participants?.length > 0) {
                if (!this.doesListHaveLinkedParticipant(participants, x)) {
                    const linkedParticipants = this.mapLinkedParticipant(x, pats);
                    const room = this.getVmrFromRoom(linkedParticipants, pats);
                    const participant = LinkedParticipantPanelModel.fromListOfPanelModels(linkedParticipants, room?.label, room?.id);
                    participants.push(participant);
                }
            } else {
                const participant = new ParticipantPanelModel(x);
                participants.push(participant);
            }
        });
        return participants;
    }
    getVmrFromRoom(linkedParticipants: ParticipantPanelModel[], pats: ParticipantForUserResponse[]): RoomSummaryResponse {
        const participantWithRooms = pats.filter(p => p.current_room !== null);
        const linkedIds = linkedParticipants.map(lp => lp.id);
        const room = participantWithRooms.find(p => linkedIds.includes(p.id) && p.current_room);
        return room?.current_room;
    }

    private doesListHaveLinkedParticipant(pats: PanelModel[], participant: ParticipantForUserResponse): boolean {
        const filtered = pats.filter(x => x instanceof LinkedParticipantPanelModel);
        if (!filtered) {
            return false;
        }
        const linkedPanels = filtered as LinkedParticipantPanelModel[];
        return linkedPanels.some(x => x.participants.filter(p => p.id === participant.id));
    }

    private mapLinkedParticipant(participant: ParticipantForUserResponse, pats: ParticipantForUserResponse[]): ParticipantPanelModel[] {
        const linked: ParticipantForUserResponse[] = [];
        pats.forEach(p => {
            if (participant.linked_participants.map(lp => lp.linked_id).includes(p.id)) {
                linked.push(p);
            }
        });
        const allMapped = linked.map(l => new ParticipantPanelModel(l));
        allMapped.push(new ParticipantPanelModel(participant));
        return allMapped;
    }
}
