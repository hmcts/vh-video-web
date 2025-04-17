import { Role } from '../services/clients/api-client';
import { VHParticipant } from '../waiting-space/store/models/vh-conference';

export class ParticipantHelper {
    static isStaffMember(participant: VHParticipant): boolean {
        return participant?.role === Role.StaffMember;
    }
}
