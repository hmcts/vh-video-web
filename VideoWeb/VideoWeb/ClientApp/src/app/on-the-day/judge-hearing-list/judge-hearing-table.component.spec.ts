import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { JudgeHearingTableComponent } from './judge-hearing-table.component';
import { MockLogger } from 'src/app/testing/mocks/mock-logger';
import { ConferenceStatus } from 'src/app/services/clients/api-client';
import { JudgeHearingSummary } from 'src/app/shared/models/JudgeHearingSummary';
import { HearingVenueFlagsService } from 'src/app/services/hearing-venue-flags.service';
import { BehaviorSubject } from 'rxjs';
import { getSpiedPropertyGetter } from 'src/app/shared/jasmine-helpers/property-helpers';

describe('JudgeHearingTableComponent', () => {
    let component: JudgeHearingTableComponent;
    const testData = new ConferenceTestData();
    let mockedHearingVenueFlagsService: HearingVenueFlagsService;
    let hearingVenueIsScottishSubject: BehaviorSubject<boolean>;

    beforeEach(() => {
        mockedHearingVenueFlagsService = jasmine.createSpyObj<HearingVenueFlagsService>(
            'HearingVenueFlagsService',
            [],
            ['HearingVenueIsScottish']
        );
        hearingVenueIsScottishSubject = new BehaviorSubject(false);
        getSpiedPropertyGetter(mockedHearingVenueFlagsService, 'HearingVenueIsScottish').and.returnValue(hearingVenueIsScottishSubject);

        component = new JudgeHearingTableComponent(new MockLogger(), mockedHearingVenueFlagsService);
        component.conferences = testData.getTestData();
        component.ngOnInit();
    });

    it('re sets hearing venue flag to false ', () => {
        const nextSpy = spyOn(hearingVenueIsScottishSubject, 'next');
        component.ngOnInit();
        expect(nextSpy).toHaveBeenCalledWith(false);
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
