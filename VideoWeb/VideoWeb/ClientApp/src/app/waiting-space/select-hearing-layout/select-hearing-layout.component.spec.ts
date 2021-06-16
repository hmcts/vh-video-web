import { ConferenceResponse } from 'src/app/services/clients/api-client';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { videoCallServiceSpy } from 'src/app/testing/mocks/mock-video-call.service';
import { HearingLayout } from 'src/app/services/clients/api-client';
import { SelectHearingLayoutComponent } from './select-hearing-layout.component';
import { onLangChangeSpy, translateServiceSpy } from 'src/app/testing/mocks/mock-translation.service';
import { fakeAsync, tick } from '@angular/core/testing';
import { LangChangeEvent } from '@ngx-translate/core';

describe('SelectHearingLayoutComponent', () => {
    let component: SelectHearingLayoutComponent;
    const videoCallService = videoCallServiceSpy;
    let conference: ConferenceResponse;
    const translateService = translateServiceSpy;
    const headingButton = document.createElement('button');
    const textButton = document.createElement('button');
    const buttonContentKeyWhenOpen = 'open-all';
    const buttonContentKeyWhenClosed = 'close-all';

    beforeEach(() => {
        conference = new ConferenceTestData().getConferenceDetailNow();
        component = new SelectHearingLayoutComponent(videoCallService, translateService);
        component.conference = conference;
        textButton.innerHTML = 'Open all';
        document.getElementById = jasmine.createSpy('accordion-choose-layout-heading').and.returnValue(headingButton);
        document.getElementsByClassName = jasmine.createSpy('govuk-accordion__open-all').and.returnValue({
            item() {
                return textButton;
            }
        });

        (<any>window).GOVUKFrontend = { initAll() {} };
    });

    it('should use cached layout preference on init', () => {
        const layout = HearingLayout.Dynamic;
        videoCallService.getPreferredLayout.and.returnValue(layout);
        component.ngOnInit();
        expect(component.selectedLayout).toBe(layout);
        expect(component.currentButtonContentKey).toBe(buttonContentKeyWhenOpen);
    });

    it('should call translate service to update accordion button when language changes', () => {
        const expectedTranslatedContentForButton = 'this is translated for open all button';
        component.currentButtonContentKey = buttonContentKeyWhenOpen;
        translateServiceSpy.instant
            .withArgs(`select-hearing-layout.${component.currentButtonContentKey}`)
            .and.returnValue(expectedTranslatedContentForButton);
        component.ngOnInit();
        onLangChangeSpy.emit({ lang: 'tl' } as LangChangeEvent);
        expect(component.accordionOpenAllElement.innerHTML).toContain(expectedTranslatedContentForButton);
        expect(component.currentButtonContentKey).toBe(buttonContentKeyWhenOpen);
    });

    it('should call translate service to update accordion header when language changes', () => {
        const expectedTranslatedContentForHeader = 'this is translated for the accordion header';
        translateServiceSpy.instant
            .withArgs('select-hearing-layout.choose-hearing-layout')
            .and.returnValue(expectedTranslatedContentForHeader);
        component.ngOnInit();
        onLangChangeSpy.emit({ lang: 'tl' } as LangChangeEvent);
        expect(headingButton.innerHTML).toContain(expectedTranslatedContentForHeader);
    });

    it('should translate button text on text click', () => {
        component.ngOnInit();
        textButton.innerHTML = 'Close all';
        textButton.click();
        expect(textButton.innerHTML).toBe('<span>select-hearing-layout.close-all</span>');
        expect(component.currentButtonContentKey).toBe(buttonContentKeyWhenClosed);
    });

    it('should translate button text on header click', () => {
        component.ngOnInit();
        textButton.innerHTML = 'Close all';
        headingButton.click();
        expect(textButton.innerHTML).toBe('<span>select-hearing-layout.close-all</span>');
        expect(component.currentButtonContentKey).toBe(buttonContentKeyWhenClosed);
    });

    it('should translate button text on after time for header click', fakeAsync(() => {
        component.ngOnInit();
        component.setAccordionText({ target: { id: 'accordion-choose-layout-heading' } as any } as MouseEvent);
        textButton.innerHTML = 'Close all';
        tick(10);
        expect(textButton.innerHTML).toBe('<span>select-hearing-layout.close-all</span>');
        expect(component.currentButtonContentKey).toBe(buttonContentKeyWhenClosed);
    }));

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
