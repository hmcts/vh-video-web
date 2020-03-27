import { Role } from 'src/app/services/clients/api-client';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { ParticipantSummary } from './participant-summary';

describe('ParticipantSummary', () => {
    it('should throw an error if passing an invlid type', () => {
        const p = new ConferenceTestData().getConferenceDetailFuture().participants[0];
        expect(() => new ParticipantSummary(p)).toThrowError();
    });

    it('should get base participant', () => {
        const p = new ConferenceTestData().getConferenceFuture().participants[0];
        const participant = new ParticipantSummary(p);
        expect(participant.base).toBe(p);
    });

    it('should map participant info', () => {
        const p = new ConferenceTestData().getConferenceFuture().participants[0];
        const participant = new ParticipantSummary(p);
        expect(participant.username).toBe(p.username);
        expect(participant.status).toBe(p.status);
        expect(participant.role).toBe(p.role);
        expect(participant.displayName).toBe(p.display_name);
        expect(participant.representee).toBe(p.representee);
        expect(participant.caseGroup).toBe(p.case_type_group);
    });

    it('should return true if a judge', () => {
        const p = new ConferenceTestData().getConferenceFuture().participants.find(x => x.role === Role.Judge);
        const participant = new ParticipantSummary(p);
        expect(participant.isJudge).toBeTruthy();
    });

    it('should return false if not a judge', () => {
        const p = new ConferenceTestData().getConferenceFuture().participants.find(x => x.role !== Role.Judge);
        const participant = new ParticipantSummary(p);
        expect(participant.isJudge).toBeFalsy();
    });
});
