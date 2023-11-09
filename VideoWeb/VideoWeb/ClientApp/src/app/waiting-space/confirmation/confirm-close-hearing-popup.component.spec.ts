import { ConfirmStartHearingPopupComponent } from './confirm-start-hearing-popup.component';
import { translateServiceSpy } from 'src/app/testing/mocks/mock-translation.service';
import { FEATURE_FLAGS, LaunchDarklyService } from 'src/app/services/launch-darkly.service';
import { of } from 'rxjs';

describe('ConfirmStartHearingPopupComponent', () => {
    let component: ConfirmStartHearingPopupComponent;
    const translateService = translateServiceSpy;
    const launchDarklyServiceSpy = jasmine.createSpyObj<LaunchDarklyService>(['getFlag']);

    beforeEach(() => {
        translateService.instant.calls.reset();
        launchDarklyServiceSpy.getFlag.withArgs(FEATURE_FLAGS.hostMuteMicrophone, false).and.returnValue(of(true));
        component = new ConfirmStartHearingPopupComponent(translateService, launchDarklyServiceSpy);
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

    describe('onConfirmAnswered', () => {
        it('should respond with yes when answer is true', () => {
            const respondWithYesSpy = spyOn(component, 'respondWithYes');
            component.onConfirmAnswered(true);
            expect(respondWithYesSpy).toHaveBeenCalled();
        });

        it('should respond with no when answer is false', () => {
            const respondWithNoSpy = spyOn(component, 'respondWithNo');
            component.onConfirmAnswered(false);
            expect(respondWithNoSpy).toHaveBeenCalled();
        });
    });
});
