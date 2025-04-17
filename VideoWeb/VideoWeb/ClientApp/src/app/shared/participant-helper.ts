import { Role } from '../services/clients/api-client';
import { VHParticipant } from '../waiting-space/store/models/vh-conference';

export class ParticipantHelper {
    static isStaffMember(participant: VHParticipant): boolean {
        return participant?.role === Role.StaffMember;
    }

    static isInJohRoom(participant: VHParticipant): boolean {
        return participant?.room?.label.startsWith('JudgeJOH');
    }

    static isHost(participant: VHParticipant): boolean {
        return participant?.role === Role.Judge || participant?.role === Role.StaffMember;
    }
}
