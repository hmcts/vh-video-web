import { ConfirmStartHearingPopupComponent } from './confirm-start-hearing-popup.component';
import { translateServiceSpy } from 'src/app/testing/mocks/mock-translation-service';

describe('ConfirmStartHearingPopupComponent', () => {
    let component: ConfirmStartHearingPopupComponent;
    const translateService = translateServiceSpy;

    beforeEach(() => {
        translateService.instant.calls.reset();
        component = new ConfirmStartHearingPopupComponent(translateService);
    });

    it('should return "start" by default', () => {
        const expectedText = 'start';
        translateServiceSpy.instant.and.returnValues(expectedText);
        expect(component.action).toBe('start');
    });

    it('should return "start" if hearing has not started', () => {
        component.hearingStarted = false;
        const expectedText = 'start';
        translateServiceSpy.instant.and.returnValues(expectedText);
        expect(component.action).toBe(expectedText);
    });

    it('should return "resume" if hearing has already begun', () => {
        component.hearingStarted = true;
        const expectedText = 'resume';
        translateServiceSpy.instant.and.returnValues(expectedText);
        expect(component.action).toBe(expectedText);
    });
});
