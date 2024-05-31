import { VHParticipant } from '../store/models/vh-conference';

export interface ParticipantListItem extends Omit<VHParticipant, 'init' | 'toJSON'> {
    interpreter?: VHParticipant;
}
