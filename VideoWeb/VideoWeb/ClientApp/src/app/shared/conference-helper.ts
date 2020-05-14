import { HearingSummary } from './models/hearing-summary';
import { ParticipantSummary } from './models/participant-summary';

export class ConferenceHelper {
    static findParticipantInHearings(hearings: HearingSummary[], conferenceId: string, participantId: string): ParticipantSummary {
        const conf = hearings.find(c => c.id === conferenceId);
        if (conf) {
            return conf.getParticipants().find(p => p.id === participantId);
        } else {
            return undefined;
        }
    }
}
