import { ConferenceStatus, ParticipantStatus } from 'src/app/services/clients/api-client';
import { JoinConsultationDecider } from './join-consultation-decider';

describe('JoinConsultationDecider', () => {
    it('should return true when conference is in session, participant is in consultation, and is host', () => {
        const result = JoinConsultationDecider.shouldJoinConsultation(ConferenceStatus.InSession, ParticipantStatus.InConsultation, true);
        expect(result).toBeTrue();
    });

    it('should return false when conference is not in session', () => {
        const result = JoinConsultationDecider.shouldJoinConsultation(ConferenceStatus.NotStarted, ParticipantStatus.InConsultation, true);
        expect(result).toBeFalse();
    });

    it('should return false when participant is not in consultation', () => {
        const result = JoinConsultationDecider.shouldJoinConsultation(ConferenceStatus.InSession, ParticipantStatus.Available, true);
        expect(result).toBeFalse();
    });

    it('should return false when participant status is missing', () => {
        const result = JoinConsultationDecider.shouldJoinConsultation(ConferenceStatus.InSession, null, true);
        expect(result).toBeFalse();
    });

    it('should return false when not host', () => {
        const result = JoinConsultationDecider.shouldJoinConsultation(ConferenceStatus.InSession, ParticipantStatus.InConsultation, false);
        expect(result).toBeFalse();
    });
});
