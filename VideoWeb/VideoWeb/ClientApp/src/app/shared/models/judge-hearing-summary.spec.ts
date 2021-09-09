import { ConferenceForHostResponse, ConferenceStatus, ParticipantForHostResponse, Role } from 'src/app/services/clients/api-client';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { HearingRole } from 'src/app/waiting-space/models/hearing-role-model';
import { HearingSummary } from './hearing-summary';
import { JudgeHearingSummary } from './JudgeHearingSummary';
import { ParticipantSummary } from './participant-summary';

fdescribe('JudgeHearingSummary', () => {
    let conference: ConferenceForHostResponse;
    const testData = new ConferenceTestData();

    beforeEach(() => {
        const allParticiantTypes = testData.getListOfParticipants();
        conference = testData.getConferenceFuture() as ConferenceForHostResponse;
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

    it('should get observers including quick link observers', () => {
        const hearing = new JudgeHearingSummary(conference);
        const observers = hearing.observers;
        expect(observers.filter(x => x.hearingRole !== HearingRole.OBSERVER && x.role !== Role.QuickLinkObserver).length).toBe(0);
        expect(observers.length).toBe(2);
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

    it('should get staff members', () => {
        const hearing = new JudgeHearingSummary(conference);
        const staffMembers = hearing.staffMembers;
        expect(staffMembers.filter(x => x.hearingRole !== HearingRole.STAFF_MEMBER).length).toBe(0);
        expect(staffMembers.length).toBe(1);
    });

    it('should get non judicial participants, excluding observers', () => {
        const hearing = new JudgeHearingSummary(conference);
        const participants = hearing.nonJudicialParticipantsExcludingObservers;

        expect(
            participants.filter(
                x =>
                    x.role !== Role.Individual &&
                    x.role !== Role.Representative &&
                    x.hearingRole !== HearingRole.WINGER &&
                    x.role !== Role.QuickLinkParticipant
            ).length
        ).toBe(0);
        expect(participants.length).toBe(6);
    });

    it('should return isExpired false when hearing is not closed', () => {
        conference.status = ConferenceStatus.Paused;
        const hearing = new JudgeHearingSummary(conference);
        expect(hearing.isExpired()).toBeFalsy();
    });

    it('should return isExpired false when hearing closed for less than 120 minutes', () => {
        conference.status = ConferenceStatus.Closed;
        conference.closed_date_time = new Date();
        const hearing = new JudgeHearingSummary(conference);
        expect(hearing.isExpired()).toBeFalsy();
    });

    it('should return isExpired true when hearing closed for more than 120 minutes', () => {
        conference.status = ConferenceStatus.Closed;
        const closedDateTime = new Date(new Date().toUTCString());
        closedDateTime.setUTCMinutes(closedDateTime.getUTCMinutes() - 120);
        conference.closed_date_time = closedDateTime;
        const hearing = new JudgeHearingSummary(conference);
        expect(hearing.isExpired()).toBeTruthy();
    });
});
