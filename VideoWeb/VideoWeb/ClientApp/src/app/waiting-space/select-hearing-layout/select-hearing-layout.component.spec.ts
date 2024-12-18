import { fakeAsync, tick } from '@angular/core/testing';
import { LangChangeEvent } from '@ngx-translate/core';
import { of } from 'rxjs';
import { ConferenceResponse, HearingLayout } from 'src/app/services/clients/api-client';
import { HearingLayoutService } from 'src/app/services/hearing-layout.service';
import { getSpiedPropertyGetter } from 'src/app/shared/jasmine-helpers/property-helpers';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { translateServiceSpy } from 'src/app/testing/mocks/mock-translation.service';
import { SelectHearingLayoutComponent } from './select-hearing-layout.component';
import { mapConferenceToVHConference } from '../store/models/api-contract-to-state-model-mappers';

describe('SelectHearingLayoutComponent', () => {
    let hearingLayoutServiceSpy: jasmine.SpyObj<HearingLayoutService>;
    let component: SelectHearingLayoutComponent;
    let conference: ConferenceResponse;
    const translateService = translateServiceSpy;
    const headingButton = document.createElement('button');
    const textButton = document.createElement('button');
    const buttonContentKeyWhenOpen = 'open-all';
    const buttonContentKeyWhenClosed = 'close-all';

    beforeEach(() => {
        conference = new ConferenceTestData().getConferenceDetailNow();
        hearingLayoutServiceSpy = jasmine.createSpyObj<HearingLayoutService>(
            ['getCurrentLayout', 'updateCurrentLayout'],
            ['currentLayout$', 'recommendedLayout$']
        );
        component = new SelectHearingLayoutComponent(hearingLayoutServiceSpy, translateService);
        component.conference = mapConferenceToVHConference(conference);
        textButton.innerHTML = 'Open all';
        document.getElementById = jasmine.createSpy('accordion-choose-layout-heading').and.returnValue(headingButton);
        document.getElementsByClassName = jasmine.createSpy('govuk-accordion__open-all').and.returnValue({
            item() {
                return textButton;
            }
        });
    });

    describe('currentLayout$', () => {
        it('should return currentLayout$ from hearingLayoutService', () => {
            // Arrange
            const expectedCurrentLayout$ = of(HearingLayout.Dynamic);
            getSpiedPropertyGetter(hearingLayoutServiceSpy, 'currentLayout$').and.returnValue(expectedCurrentLayout$);

            // Act
            const currentLayout$ = component.currentLayout$;

            // Assert
            expect(currentLayout$).toBe(expectedCurrentLayout$);
        });
    });

    describe('recommendedLayout$', () => {
        it('should return recommendedLayout$ from hearingLayoutService', () => {
            // Arrange
            const expectedRecommendedLayout$ = of(HearingLayout.Dynamic);
            getSpiedPropertyGetter(hearingLayoutServiceSpy, 'recommendedLayout$').and.returnValue(expectedRecommendedLayout$);

            // Act
            const recommendedLayout$ = component.recommendedLayout$;

            // Assert
            expect(recommendedLayout$).toBe(expectedRecommendedLayout$);
        });
    });

    describe('updateSelectedLayout', () => {
        it('should call updateCurrentLayout in hearingLayoutService with the selected layout', () => {
            // Arrange
            const expectedLayout = HearingLayout.OnePlus7;
            const callbackSpy = jasmine.createSpy('callback', () => {});

            // Act
            component.updateSelectedLayout(expectedLayout, callbackSpy);

            // Assert
            expect(hearingLayoutServiceSpy.updateCurrentLayout).toHaveBeenCalledOnceWith(expectedLayout);
            expect(callbackSpy).toHaveBeenCalled();
        });
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

    describe('onLangChange event', () => {
        it('should show translated text on open accordion button', () => {
            const expectedTranslatedContentForButton = 'this is translated for open all button';
            component.currentButtonContentKey = buttonContentKeyWhenOpen;
            translateServiceSpy.instant
                .withArgs(`select-hearing-layout.${component.currentButtonContentKey}`)
                .and.returnValue('initial content');
            component.ngOnInit();
            translateServiceSpy.instant
                .withArgs(`select-hearing-layout.${component.currentButtonContentKey}`)
                .and.returnValue(expectedTranslatedContentForButton);
            translateServiceSpy.onLangChange.emit({ lang: 'tl' } as LangChangeEvent);
            expect(component.accordionOpenAllElement.innerHTML).toContain(expectedTranslatedContentForButton);
        });

        it('should show translated text on open/close toggle button', () => {
            const expectedTranslatedContentForHeader = 'this is translated for the accordion header';
            translateServiceSpy.instant
                .withArgs(`select-hearing-layout.${component.currentButtonContentKey}`)
                .and.returnValue('initial content');
            component.ngOnInit();
            translateServiceSpy.instant
                .withArgs('select-hearing-layout.choose-hearing-layout')
                .and.returnValue(expectedTranslatedContentForHeader);
            translateServiceSpy.onLangChange.emit({ lang: 'tl' } as LangChangeEvent);
            expect(headingButton.innerHTML).toContain(expectedTranslatedContentForHeader);
        });

        it('should unsubscribe subscriptions', () => {
            spyOn(component.subscriptions, 'unsubscribe');
            component.ngOnDestroy();
            expect(component.subscriptions.unsubscribe).toHaveBeenCalledTimes(1);
        });
    });

    describe('onClose', () => {
        it('should emit close button pressed event', () => {
            spyOn(component.closeButtonPressed, 'emit');
            component.onClose();
            expect(component.closeButtonPressed.emit).toHaveBeenCalledTimes(1);
        });
    });

    describe('ngAfterUpdate', () => {
        it('should scroll the selected layout into view', () => {
            // Arrange
            const selectedLayout = HearingLayout.NineEqual;
            spyOnProperty(component, 'currentLayout$', 'get').and.returnValue(of(selectedLayout));
            const container = document.getElementById('select-hearing-container-content-1');
            spyOn(container, 'scrollBy');

            // Act
            component.ngOnInit();
            component.ngAfterViewInit();

            // Assert
            const selectedLayoutElement = document.getElementById(`layout-radio-button-${selectedLayout}`);
            const expectedOffset = selectedLayoutElement.getBoundingClientRect().top - container.getBoundingClientRect().top;

            // @ts-ignore
            expect(container.scrollBy).toHaveBeenCalledWith({
                top: expectedOffset,
                behavior: 'smooth'
            });
        });

        it('should not scroll the selected layout into view if component is not present', () => {
            // Arrange
            const selectedLayout = HearingLayout.NineEqual;
            const layoutElementId = `layout-radio-button-${selectedLayout}`;
            spyOnProperty(component, 'currentLayout$', 'get').and.returnValue(of(selectedLayout));
            const container = document.getElementById('select-hearing-container-content-1');
            spyOn(container, 'scrollBy');

            document.getElementById = jasmine.createSpy('getElementById').and.callFake((id: string) => {
                if (id === layoutElementId) {
                    return null;
                }
                if (id === 'accordion-choose-layout-heading') {
                    return headingButton;
                }
                return container;
            });

            // Act
            component.ngOnInit();
            component.ngAfterViewInit();

            // Assert

            // @ts-ignore
            expect(container.scrollBy).not.toHaveBeenCalledWith();
        });
    });
});
