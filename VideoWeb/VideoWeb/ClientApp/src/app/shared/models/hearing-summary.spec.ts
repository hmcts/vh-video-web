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
        expect(hearing.status).toBe(c.status);
        expect(hearing.caseName).toBe(c.case_name);
        expect(hearing.caseNumber).toBe(c.case_number);
        expect(hearing.scheduledStartTime).toEqual(c.scheduled_date_time);
        expect(hearing.scheduledEndTime).toBeDefined();
        expect(hearing.hearingVenueName).toBe(c.hearing_venue_name);
        expect(hearing.startedDateTime).toEqual(c.started_date_time);
        expect(hearing.endedDateTime).toEqual(c.scheduled_date_time);
        expect(hearing.judgeName).toEqual('Judge Fudge');
    });

    it('should get applicant rep', () => {
        const c = new ConferenceTestData().getConferenceFuture();
        const hearing = new HearingSummary(c);
        const appRep = hearing.applicantRepresentative;
        expect(appRep.role).toBe(Role.Representative);
    });

    it('should get applicants', () => {
        const c = new ConferenceTestData().getConferenceFuture();
        const hearing = new HearingSummary(c);
        const apps = hearing.applicants;
        const groups = apps.filter(x => x.caseGroup !== 'applicant').length;
        expect(groups).toBe(0);
    });

    it('should get defendent rep', () => {
        const c = new ConferenceTestData().getConferenceFuture();
        const hearing = new HearingSummary(c);
        const defRep = hearing.defendantRepresentative;
        expect(defRep.role).toBe(Role.Representative);
    });

    it('should get respondents', () => {
        const c = new ConferenceTestData().getConferenceFuture();
        const hearing = new HearingSummary(c);
        const respondents = hearing.respondents;
        const groups = respondents.filter(x => x.caseGroup !== 'respondent').length;
        expect(groups).toBe(0);
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
});
