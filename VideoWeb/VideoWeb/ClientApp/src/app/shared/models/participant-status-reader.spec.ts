import { ParticipantStatusReader } from './participant-status-reader';
import { ParticipantStatus } from '../../services/clients/api-client';

describe('ParticipantStatusReader', () => {
    it('should get status as text', () => {
        const reader = new ParticipantStatusReader();

        expect(reader.getStatusAsText(ParticipantStatus.None)).toBe('Not Signed In');
        expect(reader.getStatusAsText(ParticipantStatus.NotSignedIn)).toBe('Not Signed In');
        expect(reader.getStatusAsText(ParticipantStatus.InConsultation)).toBe('In Consultation');
        expect(reader.getStatusAsText(ParticipantStatus.InHearing)).toBe('In Hearing');
        expect(reader.getStatusAsText(ParticipantStatus.UnableToJoin)).toBe('Unable to Join');
        expect(reader.getStatusAsText(ParticipantStatus.Disconnected)).toBe('Disconnected');

        expect(reader.getStatusAsTextForJudge(ParticipantStatus.None)).toBe('Unavailable');
        expect(reader.getStatusAsTextForJudge(ParticipantStatus.NotSignedIn)).toBe('Unavailable');
        expect(reader.getStatusAsTextForJudge(ParticipantStatus.InConsultation)).toBe('Unavailable');
        expect(reader.getStatusAsTextForJudge(ParticipantStatus.UnableToJoin)).toBe('Unavailable');
        expect(reader.getStatusAsTextForJudge(ParticipantStatus.InHearing)).toBe('In Hearing');
        expect(reader.getStatusAsTextForJudge(ParticipantStatus.Available)).toBe('Available');
    });
});
