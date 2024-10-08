import { FocusService } from 'src/app/services/focus.service';
import { ConfirmStartHearingPopupComponent } from './confirm-start-hearing-popup.component';
import { translateServiceSpy } from 'src/app/testing/mocks/mock-translation.service';

describe('ConfirmStartHearingPopupComponent', () => {
    let component: ConfirmStartHearingPopupComponent;
    const translateService = translateServiceSpy;
    let focusServiceSpy: jasmine.SpyObj<FocusService>;
    const muteMicrophoneFormSpy = jasmine.createSpyObj('MuteMicrophoneComponent', ['save']);

    beforeEach(() => {
        focusServiceSpy = jasmine.createSpyObj<FocusService>('FocusService', ['restoreFocus']);
        translateService.instant.calls.reset();
        component = new ConfirmStartHearingPopupComponent(translateService, focusServiceSpy);
        component.muteMicrophoneForm = muteMicrophoneFormSpy;
        muteMicrophoneFormSpy.save.calls.reset();
    });

    it('should return "start" by default', () => {
        const expectedText = 'confirm-start-hearing-popup.start';
        expect(component.action).toBe(expectedText);
    });

    it('should return "start" if hearing has not started', () => {
        component.hearingStarted = false;
        const expectedText = 'confirm-start-hearing-popup.start';
        expect(component.action).toBe(expectedText);
    });

    it('should return "resume" if hearing has already begun', () => {
        component.hearingStarted = true;
        const expectedText = 'confirm-start-hearing-popup.resume';
        expect(component.action).toBe(expectedText);
    });

    describe('respondWithYes', () => {
        it('should save mute microphone form', () => {
            const popupAnsweredSpy = spyOn(component.popupAnswered, 'emit');
            component.respondWithYes();
            expect(muteMicrophoneFormSpy.save).toHaveBeenCalled();
            expect(popupAnsweredSpy).toHaveBeenCalledWith(true);
        });
    });
});
