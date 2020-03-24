import { Participant } from './participant';
import { ParticipantStatus } from 'src/app/services/clients/api-client';

export class ParticipantStatusModel {
    Participants: Participant[];
    JudgeStatuses: ParticipantStatus[];
    HearingVenueName: string;
}
