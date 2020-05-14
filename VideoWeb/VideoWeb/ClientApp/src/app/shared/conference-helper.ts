import { ConferenceForVhOfficerResponse, ParticipantForUserResponse } from '../services/clients/api-client';
import { HearingSummary } from './models/hearing-summary';
import { ParticipantSummary } from './models/participant-summary';

export class ConferenceHelper {
    static findParticipantInConferences(conferences: ConferenceForVhOfficerResponse[], participantId: string): ParticipantForUserResponse {
        const filtered = conferences.find(x => x.participants.find(p => p.id === participantId));
        if (!filtered) {
            return null;
        }
        return filtered.participants.find(p => p.id === participantId);
    }

    static findParticipantInHearings(hearings: HearingSummary[], participantId: string): ParticipantSummary {
        const filtered = hearings.find(x => x.getParticipants().find(p => p.id === participantId));
        if (!filtered) {
            return null;
        }
        return filtered.getParticipants().find(p => p.id === participantId);
    }
}
