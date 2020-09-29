import { ConferenceResponse } from 'src/app/services/clients/api-client';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { videoCallServiceSpy } from 'src/app/testing/mocks/mock-video-call-service';
import { HearingLayout } from 'src/app/services/clients/api-client';
import { SelectHearingLayoutComponent } from './select-hearing-layout.component';

describe('SelectHearingLayoutComponent', () => {
    let component: SelectHearingLayoutComponent;
    const videoCallService = videoCallServiceSpy;
    let conference: ConferenceResponse;

    beforeEach(() => {
        conference = new ConferenceTestData().getConferenceDetailNow();
        component = new SelectHearingLayoutComponent(videoCallService);
        component.conference = conference;
        (<any>window).GOVUKFrontend = { initAll() {} };
    });

    it('should use cached layout preference on init', () => {
        const layout = HearingLayout.Dynamic;
        videoCallService.getPreferredLayout.and.returnValue(layout);
        component.ngOnInit();
        expect(component.selectedLayout).toBe(layout);
    });

    it('should use recommended layout when cached layout preference is empty on init', () => {
        const layout = HearingLayout.OnePlus7;
        videoCallService.getPreferredLayout.and.returnValue(null);
        spyOn(component, 'recommendedLayout').and.returnValue(layout);
        component.ngOnInit();
        expect(component.selectedLayout).toBe(layout);
    });

    const recommendLayoutForTestCases = [
        { numOfParticipantsIncJudge: 1, expected: HearingLayout.Dynamic },
        { numOfParticipantsIncJudge: 2, expected: HearingLayout.Dynamic },
        { numOfParticipantsIncJudge: 3, expected: HearingLayout.Dynamic },
        { numOfParticipantsIncJudge: 4, expected: HearingLayout.Dynamic },
        { numOfParticipantsIncJudge: 5, expected: HearingLayout.Dynamic },
        { numOfParticipantsIncJudge: 6, expected: HearingLayout.OnePlus7 },
        { numOfParticipantsIncJudge: 7, expected: HearingLayout.OnePlus7 },
        { numOfParticipantsIncJudge: 8, expected: HearingLayout.OnePlus7 },
        { numOfParticipantsIncJudge: 9, expected: HearingLayout.OnePlus7 },
        { numOfParticipantsIncJudge: 10, expected: HearingLayout.TwoPlus21 },
        { numOfParticipantsIncJudge: 11, expected: HearingLayout.TwoPlus21 },
        { numOfParticipantsIncJudge: 12, expected: HearingLayout.TwoPlus21 }
    ];

    recommendLayoutForTestCases.forEach(test => {
        it(`should recommend layout ${test.expected} when number of participants is ${test.numOfParticipantsIncJudge}`, () => {
            expect(component.recommendLayoutFor(test.numOfParticipantsIncJudge)).toBe(test.expected);
        });
    });

    it(`should recommend layout when endpoints is null`, () => {
        component.conference.endpoints = null;
        expect(component.recommendedLayout()).toBeDefined();
    });

    it('should save selected layout', () => {
        const layout = HearingLayout.Dynamic;
        component.updateSelectedLayout(layout);
        expect(component.selectedLayout).toBe(layout);
        expect(videoCallService.updatePreferredLayout).toHaveBeenCalledWith(component.conference.id, layout);
    });

    it('should return selected layout', () => {
        const layout = HearingLayout.OnePlus7;
        component.selectedLayout = layout;
        expect(component.getSelectedOrPreferredLayout()).toBe(layout);
    });

    it('should return recommended layout', () => {
        component.selectedLayout = undefined;
        expect(component.getSelectedOrPreferredLayout()).toBe(HearingLayout.Dynamic);
    });

    it('should return true when accordian is open', () => {
        const accordian: HTMLDivElement = document.createElement('div');
        document.getElementById = jasmine.createSpy('accordian-container').and.returnValue(accordian);
        accordian.classList.add('govuk-accordion__section--expanded');

        expect(component.isAccordianOpen).toBeTruthy();
    });

    it('should return false when accordian is close', () => {
        const accordian: HTMLDivElement = document.createElement('div');
        document.getElementById = jasmine.createSpy('accordian-container').and.returnValue(accordian);

        expect(component.isAccordianOpen).toBeFalsy();
    });

    it('should return true when dynamic is recommended', () => {
        spyOn(component, 'recommendedLayout').and.returnValue(HearingLayout.Dynamic);
        expect(component.recommendDynamic).toBeTruthy();
        expect(component.recommend1Plus7).toBeFalsy();
        expect(component.recommend2Plus21).toBeFalsy();
    });

    it('should return true when 2+1 is recommended', () => {
        spyOn(component, 'recommendedLayout').and.returnValue(HearingLayout.TwoPlus21);
        expect(component.recommendDynamic).toBeFalsy();
        expect(component.recommend1Plus7).toBeFalsy();
        expect(component.recommend2Plus21).toBeTruthy();
    });

    it('should return true when 1+7 is recommended', () => {
        spyOn(component, 'recommendedLayout').and.returnValue(HearingLayout.OnePlus7);
        expect(component.recommendDynamic).toBeFalsy();
        expect(component.recommend1Plus7).toBeTruthy();
        expect(component.recommend2Plus21).toBeFalsy();
    });
});
