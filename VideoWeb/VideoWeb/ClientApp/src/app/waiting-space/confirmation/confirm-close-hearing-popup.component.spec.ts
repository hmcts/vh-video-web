import { ConfirmStartHearingPopupComponent } from './confirm-start-hearing-popup.component';
import { translateServiceSpy } from 'src/app/testing/mocks/mock-translation.service';
import { FEATURE_FLAGS, LaunchDarklyService } from 'src/app/services/launch-darkly.service';
import { of } from 'rxjs';

describe('ConfirmStartHearingPopupComponent', () => {
    let component: ConfirmStartHearingPopupComponent;
    const translateService = translateServiceSpy;
    const launchDarklyServiceSpy = jasmine.createSpyObj<LaunchDarklyService>(['getFlag']);
    const muteMicrophoneFormSpy = jasmine.createSpyObj('MuteMicrophoneComponent', ['save']);

    beforeEach(() => {
        translateService.instant.calls.reset();
        launchDarklyServiceSpy.getFlag.withArgs(FEATURE_FLAGS.hostMuteMicrophone, false).and.returnValue(of(true));
        component = new ConfirmStartHearingPopupComponent(translateService, launchDarklyServiceSpy);
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
        it('should save mute microphone form when feature is enabled', () => {
            const popupAnsweredSpy = spyOn(component.popupAnswered, 'emit');
            component.isMuteMicrophoneEnabled = true;
            component.respondWithYes();
            expect(muteMicrophoneFormSpy.save).toHaveBeenCalled();
            expect(popupAnsweredSpy).toHaveBeenCalledWith(true);
        });

        it('should not save mute microphone form when feature is not enabled', () => {
            const popupAnsweredSpy = spyOn(component.popupAnswered, 'emit');
            component.isMuteMicrophoneEnabled = false;
            component.respondWithYes();
            expect(muteMicrophoneFormSpy.save).not.toHaveBeenCalled();
            expect(popupAnsweredSpy).toHaveBeenCalledWith(true);
        });
    });
});
