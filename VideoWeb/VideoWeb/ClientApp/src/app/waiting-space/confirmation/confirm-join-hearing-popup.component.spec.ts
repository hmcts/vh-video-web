import { FEATURE_FLAGS, LaunchDarklyService } from 'src/app/services/launch-darkly.service';
import { of } from 'rxjs';
import { ConfirmJoinHearingPopupComponent } from './confirm-join-hearing-popup.component';
import { FocusService } from 'src/app/services/focus.service';

describe('ConfirmJoinHearingPopupComponent', () => {
    let component: ConfirmJoinHearingPopupComponent;
    let focusServiceSpy: jasmine.SpyObj<FocusService>;
    const launchDarklyServiceSpy = jasmine.createSpyObj<LaunchDarklyService>(['getFlag']);
    const muteMicrophoneFormSpy = jasmine.createSpyObj('MuteMicrophoneComponent', ['save']);

    beforeEach(() => {
        focusServiceSpy = jasmine.createSpyObj<FocusService>('FocusService', ['restoreFocus']);
        launchDarklyServiceSpy.getFlag.withArgs(FEATURE_FLAGS.hostMuteMicrophone, false).and.returnValue(of(true));
        component = new ConfirmJoinHearingPopupComponent(launchDarklyServiceSpy, focusServiceSpy);
        component.muteMicrophoneForm = muteMicrophoneFormSpy;
        muteMicrophoneFormSpy.save.calls.reset();
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
