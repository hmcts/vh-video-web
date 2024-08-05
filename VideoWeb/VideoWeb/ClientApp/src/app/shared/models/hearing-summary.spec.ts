import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { HearingSummary } from './hearing-summary';
import { Role } from 'src/app/services/clients/api-client';
import { ParticipantSummary } from './participant-summary';

describe('HearingSummary', () => {
    it('should throw an error if passing an invlid type', () => {
        const c = new ConferenceTestData().getConferenceDetailFuture();
        expect(() => new HearingSummary(c)).toThrowError();
    });

    it('should map hearing summary info', () => {
        const c = new ConferenceTestData().getConferenceFuture();
        const hearing = new HearingSummary(c);
        expect(hearing.id).toBe(c.id);
        expect(hearing.hearingRefId).toBe(c.hearing_ref_id);
        expect(hearing.status).toBe(c.status);
        expect(hearing.caseName).toBe(c.case_name);
        expect(hearing.caseType).toBe(c.case_type);
        expect(hearing.caseNumber).toBe(c.case_number);
        expect(hearing.scheduledStartTime).toEqual(c.scheduled_date_time);
        expect(hearing.scheduledDuration).toEqual(c.scheduled_duration);
        expect(hearing.scheduledEndTime).toBeDefined();
        expect(hearing.hearingVenueName).toBe(c.hearing_venue_name);
        expect(hearing.startedDateTime).toEqual(c.started_date_time);
        expect(hearing.endedDateTime).toEqual(c.closed_date_time);
        expect(hearing.judgeName).toEqual('Judge Fudge');
        expect(hearing.actualCloseTime).toEqual(c.closed_date_time);
        expect(hearing.allocatedCso).toEqual(c.allocated_cso);
    });

    it('should return judge', () => {
        const c = new ConferenceTestData().getConferenceFuture();
        const judge = new HearingSummary(c).judge;
        expect(judge).toBeDefined();
        expect(judge.role).toBe(Role.Judge);
    });

    it('should return base participants', () => {
        const c = new ConferenceTestData().getConferenceFuture();
        const hearing = new HearingSummary(c);
        const p = hearing.getParticipants();
        expect(c.participants.map(x => new ParticipantSummary(x))).toEqual(p);
    });

    it('should return duration as text', () => {
        const c = new ConferenceTestData().getConferenceFuture();
        c.scheduled_duration = 30;
        const hearing = new HearingSummary(c);
        expect(hearing.getDurationAsText()).toBe('30m');
    });

    it('should return judge name', () => {
        const c = new ConferenceTestData().getConferenceFuture();
        const judge = new HearingSummary(c).judge;
        expect(judge).toBeDefined();
        expect(judge.role).toBe(Role.Judge);
        expect(judge.displayName).toBe('Judge Fudge');
    });

    it('should return null started date time if hearing is not started', () => {
        const c = new ConferenceTestData().getConferenceFuture();
        const hearing = new HearingSummary(c);
        expect(hearing.startedDateTime).toBeNull();
        expect(hearing.endedDateTime).toBeNull();
    });

    it('should return null ended date time if hearing has started but not ended', () => {
        const c = new ConferenceTestData().getConferenceInSession();
        const hearing = new HearingSummary(c);
        expect(hearing.startedDateTime).toEqual(c.started_date_time);
        expect(hearing.endedDateTime).toBeNull();
    });
});
