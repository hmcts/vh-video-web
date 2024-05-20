import { ParticipantResponse } from 'src/app/services/clients/api-client';
import {VHParticipant} from "../store/models/vh-conference";

export interface ParticipantListItem extends Omit<ParticipantResponse, 'init' | 'toJSON'> {
    interpreter?: VHParticipant;
}
