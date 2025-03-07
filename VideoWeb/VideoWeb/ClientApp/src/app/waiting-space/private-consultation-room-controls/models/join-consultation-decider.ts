import { ConferenceStatus, ParticipantStatus } from 'src/app/services/clients/api-client';

export class JoinConsultationDecider {
    public static shouldJoinConsultation(
        conferenceStatus: ConferenceStatus,
        participantStatus: ParticipantStatus,
        isHost: boolean
    ): boolean {
        if (conferenceStatus !== ConferenceStatus.InSession) {
            return false;
        }

        if (participantStatus !== ParticipantStatus.InConsultation) {
            return false;
        }

        return isHost;
    }
}
