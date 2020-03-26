import { ConferenceForVhOfficerResponse, ParticipantForUserResponse } from '../services/clients/api-client';

export class ConferenceHelper {
    static findParticipantInConferences(conferences: ConferenceForVhOfficerResponse[], participantId: string): ParticipantForUserResponse {
        const filtered = conferences.find(x => x.participants.find(p => p.id === participantId));
        if (!filtered) {
            return null;
        }
        return filtered.participants.find(p => p.id === participantId);
    }
}
