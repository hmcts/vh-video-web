import { ConferenceForJudgeResponse, Role } from 'src/app/services/clients/api-client';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { HearingRole } from 'src/app/waiting-space/models/hearing-role-model';
import { HearingSummary } from './hearing-summary';
import { JudgeHearingSummary } from './JudgeHearingSummary';

describe('JudgeHearingSummary', () => {
    let conference: ConferenceForJudgeResponse;
    const testData = new ConferenceTestData();

    beforeEach(() => {
        const allParticiantTypes = testData.getListOfParticipants();
        conference = testData.getConferenceFuture() as ConferenceForJudgeResponse;
        conference.participants = allParticiantTypes;
        conference.number_of_endpoints = 2;
    });

    it('should throw an error if passing an invlid type', () => {
        const c = new ConferenceTestData().getConferenceDetailFuture();
        expect(() => new HearingSummary(c)).toThrowError();
    });

    it('should map hearing summary info', () => {
        const hearing = new JudgeHearingSummary(conference);
        expect(hearing.id).toBe(conference.id);
        expect(hearing.status).toBe(conference.status);
        expect(hearing.caseName).toBe(conference.case_name);
        expect(hearing.caseNumber).toBe(conference.case_number);
        expect(hearing.scheduledStartTime).toEqual(conference.scheduled_date_time);
        expect(hearing.scheduledEndTime).toBeDefined();
        expect(hearing.judgeName).toEqual('Judge Fudge');
        expect(hearing.numberOfEndpoints).toBe(conference.number_of_endpoints);
    });

    it('should get observers', () => {
        const hearing = new JudgeHearingSummary(conference);
        const observers = hearing.observers;
        expect(observers.filter(x => x.hearingRole !== HearingRole.OBSERVER).length).toBe(0);
        expect(observers.length).toBe(1);
    });

    it('should get panel members', () => {
        const hearing = new JudgeHearingSummary(conference);
        const panelMembers = hearing.panelMembers;
        expect(panelMembers.filter(x => x.hearingRole !== HearingRole.PANEL_MEMBER).length).toBe(0);
        expect(panelMembers.length).toBe(1);
    });

    it('should get wingers', () => {
        const hearing = new JudgeHearingSummary(conference);
        const wingers = hearing.wingers;
        expect(wingers.filter(x => x.hearingRole !== HearingRole.WINGER).length).toBe(0);
        expect(wingers.length).toBe(1);
    });

    it('should get witnesses', () => {
        const hearing = new JudgeHearingSummary(conference);
        const witnesses = hearing.witnesses;
        expect(witnesses.filter(x => x.hearingRole !== HearingRole.WITNESS).length).toBe(0);
        expect(witnesses.length).toBe(1);
    });

    it('should get non judicial participants, excluding observers', () => {
        const hearing = new JudgeHearingSummary(conference);
        const participants = hearing.nonJudicialParticipantsExcludingObservers;

        expect(participants.filter(x => x.role !== Role.Individual && x.role !== Role.Representative).length).toBe(0);
        expect(participants.filter(x => x.hearingRole === HearingRole.OBSERVER).length).toBe(0);
        expect(participants.filter(x => x.hearingRole === HearingRole.PANEL_MEMBER).length).toBe(0);
        expect(participants.filter(x => x.hearingRole === HearingRole.WINGER).length).toBe(0);
        expect(participants.filter(x => x.hearingRole === HearingRole.WITNESS).length).toBe(0);
        expect(participants.length).toBe(4);
    });
});
