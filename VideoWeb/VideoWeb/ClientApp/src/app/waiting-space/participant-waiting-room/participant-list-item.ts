import { ParticipantResponse } from 'src/app/services/clients/api-client';

export interface ParticipantListItem extends Omit<ParticipantResponse, 'init' | 'toJSON'> {
    interpreter?: ParticipantResponse;
}
