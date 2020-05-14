import { ConferenceStatus } from 'src/app/services/clients/api-client';
import { Hearing } from 'src/app/shared/models/hearing';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { HearingStatusComponent } from './hearing-status.component';

describe('MonitoringGraphComponent', () => {
    let component: HearingStatusComponent;

    beforeEach(() => {
        component = new HearingStatusComponent();
    });

    const conferenceStatusTextTestCases = [
        { status: ConferenceStatus.NotStarted, expected: 'Not Started' },
        { status: ConferenceStatus.InSession, expected: 'In Session' },
        { status: ConferenceStatus.Paused, expected: 'Paused' },
        { status: ConferenceStatus.Suspended, expected: 'Suspended' },
        { status: ConferenceStatus.Closed, expected: 'Closed' }
    ];

    conferenceStatusTextTestCases.forEach(test => {
        it(`should return ${test.expected} when conference status is ${test.status}`, () => {
            const conference = new ConferenceTestData().getConferenceDetailFuture();
            conference.status = test.status;
            component.hearing = new Hearing(conference);
            expect(component.getConferenceStatusText()).toBe(test.expected);
        });
    });

    it('should get `Delayed` conference status text', () => {
        const conference = new ConferenceTestData().getConferenceDetailPast();
        conference.status = ConferenceStatus.NotStarted;
        component.hearing = new Hearing(conference);
        expect(component.getConferenceStatusText()).toBe('Delayed');
    });
});
