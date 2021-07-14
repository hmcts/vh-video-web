import { ParticipantForUserResponse, Role, RoomSummaryResponse } from 'src/app/services/clients/api-client';
import { LinkedParticipantPanelModel } from 'src/app/waiting-space/models/linked-participant-panel-model';
import { PanelModel } from 'src/app/waiting-space/models/panel-model-base';
import { ParticipantPanelModel } from 'src/app/waiting-space/models/participant-panel-model';
import { HearingRole } from 'src/app/waiting-space/models/hearing-role-model';

export class ParticipantPanelModelMapper {
    mapFromParticipantUserResponse(pats: ParticipantForUserResponse[]): PanelModel[] {
        const participants: PanelModel[] = [];
        pats.forEach(x => {
            if (x.linked_participants?.length > 0) {
                if (!this.isLinkAlreadyProcessed(participants, x)) {
                    const linkedParticipants = this.mapLinkedParticipant(x, pats);
                    const room = this.getParticipantRoom(linkedParticipants, pats);
                    const participant = LinkedParticipantPanelModel.fromListOfPanelModels(linkedParticipants, room?.label, room?.id);
                    participants.push(participant);
                }
            } else if (x.role === Role.JudicialOfficeHolder) {
                if (!this.isLinkAlreadyProcessed(participants, x)) {
                    const johs = this.mapJohs(pats);
                    const room = this.getParticipantRoom(johs, pats);
                    const participant = LinkedParticipantPanelModel.forJudicialHolders(johs, room?.label, room?.id);
                    participants.push(participant);
                }
            } else {
                const participant = new ParticipantPanelModel(x);
                participants.push(participant);
            }
        });
        return participants;
    }

    private getParticipantRoom(linkedParticipants: ParticipantPanelModel[], pats: ParticipantForUserResponse[]): RoomSummaryResponse {
        const participantWithRooms = pats.filter(p => p.interpreter_room !== null);
        const linkedIds = linkedParticipants.map(lp => lp.id);
        const participantWithRoom = participantWithRooms.find(p => linkedIds.includes(p.id) && p.interpreter_room);
        return participantWithRoom?.interpreter_room;
    }

    private isLinkAlreadyProcessed(pats: PanelModel[], participant: ParticipantForUserResponse): boolean {
        const filtered = pats.filter(x => x instanceof LinkedParticipantPanelModel);
        if (!filtered.length) {
            return false;
        }
        const linkedPanels = filtered as LinkedParticipantPanelModel[];
        return linkedPanels.some(x => x.hasParticipant(participant.id));
    }

    private mapJohs(pats: ParticipantForUserResponse[]): ParticipantPanelModel[] {
        const johs = pats.filter(x => x.role === Role.JudicialOfficeHolder);
        return johs.map(j => new ParticipantPanelModel(j));
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
        return [
            ...allMapped.filter(x => x.hearingRole !== HearingRole.INTERPRETER),
            ...allMapped.filter(x => x.hearingRole === HearingRole.INTERPRETER)
        ];
    }
}
