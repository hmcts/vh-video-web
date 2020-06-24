import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { JudgeHearingTableComponent } from './judge-hearing-table.component';
import { MockLogger } from 'src/app/testing/mocks/MockLogger';
import { ConferenceStatus } from 'src/app/services/clients/api-client';
import { JudgeHearingSummary } from 'src/app/shared/models/JudgeHearingSummary';

describe('JudgeHearingTableComponent', () => {
    const component: JudgeHearingTableComponent = new JudgeHearingTableComponent(new MockLogger());

    beforeEach(() => {
        component.conferences = new ConferenceTestData().getTestData();
        component.ngOnInit();
    });

    it('should emit when conference has been selected', () => {
        spyOn(component.selectedConference, 'emit').and.callFake(() => {});
        const hearing = component.hearings[0];
        component.signIntoConference(hearing);
        expect(component.selectedConference.emit).toHaveBeenCalled();
    });

    it('should get rep from group of participants', () => {
        const hearing = new JudgeHearingSummary(new ConferenceTestData().getConferenceNow());
        const rep = component.getRepresentative(hearing.applicants);
        expect(rep.representee).toBeDefined();
    });

    it('should get individual from group of participants', () => {
        const hearing = new JudgeHearingSummary(new ConferenceTestData().getConferenceNow());
        const ind = component.getIndividual(hearing.applicants);
        expect(ind.representee).toBeUndefined();
    });

    it('should get the participant count excluding judge', () => {
        const hearing = new JudgeHearingSummary(new ConferenceTestData().getConferenceNow());
        const participantCount = component.getParticipantsCount(hearing);
        expect(participantCount).toBe(hearing.applicants.length + hearing.respondents.length);
    });

    const conferenceStatusVisibilityTestCases = [
        { status: ConferenceStatus.Paused, expected: true },
        { status: ConferenceStatus.Suspended, expected: true },
        { status: ConferenceStatus.Closed, expected: true },
        { status: ConferenceStatus.InSession, expected: false },
        { status: ConferenceStatus.NotStarted, expected: false }
    ];

    conferenceStatusVisibilityTestCases.forEach(test => {
        it(`should show conference status ${test.expected} when conference status is ${test.status}`, () => {
            const hearing = new JudgeHearingSummary(new ConferenceTestData().getConferenceNow());
            hearing.status = test.status;
            expect(component.showConferenceStatus(hearing)).toBe(test.expected);
        });
    });
});
