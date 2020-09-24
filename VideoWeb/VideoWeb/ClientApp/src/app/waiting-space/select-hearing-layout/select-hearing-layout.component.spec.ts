import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ConferenceResponse } from 'src/app/services/clients/api-client';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { videoCallServiceSpy } from 'src/app/testing/mocks/mock-video-call-service';
import { HearingLayout } from '../models/hearing-layout';

import { SelectHearingLayoutComponent } from './select-hearing-layout.component';

describe('SelectHearingLayoutComponent', () => {
    let component: SelectHearingLayoutComponent;
    const videoCallService = videoCallServiceSpy;
    let conference: ConferenceResponse;

    beforeEach(() => {
        conference = new ConferenceTestData().getConferenceDetailNow();
        component = new SelectHearingLayoutComponent(videoCallService);
        component.conference = conference;
    });

    const recommendedLayoutTestCases = [
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

    recommendedLayoutTestCases.forEach(test => {
        it(`should recommend layout ${test.expected} when number of participants is ${test.numOfParticipantsIncJudge}`, () => {
            expect(component.recommendedLayout(test.numOfParticipantsIncJudge)).toBe(test.expected);
        });
    });

    it('should save selected layout', () => {
        const layout = HearingLayout.Dynamic;
        component.updateSelectedLayout(layout);
        expect(component.selectedLayout).toBe(layout);
        expect(videoCallService.updatePreferredLayout).toHaveBeenCalledWith(layout);
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
});
