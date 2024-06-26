import { ConferenceStatus } from 'src/app/services/clients/api-client';
import { JudgeHearingSummary } from 'src/app/shared/models/JudgeHearingSummary';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { MockLogger } from 'src/app/testing/mocks/mock-logger';
import { HostHearingTableComponent } from './host-hearing-table.component';

describe('HostHearingTableComponent', () => {
    let component: HostHearingTableComponent;
    const testData = new ConferenceTestData();

    beforeEach(() => {
        component = new HostHearingTableComponent(new MockLogger());
        component.conferences = testData.getTestData();
        component.ngOnInit();
    });

    it('should emit when conference has been selected', () => {
        spyOn(component.selectedConference, 'emit').and.callFake(() => {});
        const hearing = component.hearings[0];
        component.signIntoConference(hearing);
        expect(component.selectedConference.emit).toHaveBeenCalled();
    });

    const conferenceStatusVisibilityTestCases = [
        { status: ConferenceStatus.Paused, expected: true },
        { status: ConferenceStatus.Suspended, expected: true },
        { status: ConferenceStatus.Closed, expected: true },
        { status: ConferenceStatus.InSession, expected: true },
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
