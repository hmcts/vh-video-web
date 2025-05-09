import { VHConference, VHParticipant } from 'src/app/waiting-space/store/models/vh-conference';
import { ParticipantStatus, Role } from '../clients/api-client';
import { HearingRole } from 'src/app/waiting-space/models/hearing-role-model';

export class ConsultationRules {
    constructor(public conference: VHConference) {}

    getParticipantsInRoom(roomLabel: string): VHParticipant[] {
        return this.conference.participants.filter(x => x.status === ParticipantStatus.InConsultation && x.room?.label === roomLabel);
    }

    participantsAreScreenedFromEachOther(participant1: VHParticipant, participant2: VHParticipant): boolean {
        if (participant1.protectedFrom?.includes(participant2.externalReferenceId)) {
            return true;
        }

        if (participant2.protectedFrom?.includes(participant1.externalReferenceId)) {
            return true;
        }

        return false;
    }

    participantHasInviteRestrictions(participant: VHParticipant, roomLabel: string, loggedInUser: VHParticipant) {
        if (this.participantsAreScreenedFromEachOther(participant, loggedInUser)) {
            return true;
        }

        const participantsInRoom = this.getParticipantsInRoom(roomLabel);
        if (participantsInRoom.some(participantInRoom => this.participantsAreScreenedFromEachOther(participant, participantInRoom))) {
            return true;
        }

        const userIsJudicial =
            loggedInUser.role === Role.Judge || loggedInUser.role === Role.StaffMember || loggedInUser.role === Role.JudicialOfficeHolder;
        if (!userIsJudicial) {
            switch (participant.hearingRole) {
                case HearingRole.WINGER:
                case HearingRole.WITNESS:
                case HearingRole.EXPERT:
                case HearingRole.OBSERVER:
                case HearingRole.JUDGE:
                case HearingRole.STAFF_MEMBER:
                case HearingRole.PANEL_MEMBER:
                    return true;
                default:
                    return false;
            }
        }

        return false;
    }
}
