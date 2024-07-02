import { ConfirmJoinHearingPopupComponent } from './confirm-join-hearing-popup.component';
import { FocusService } from 'src/app/services/focus.service';

describe('ConfirmJoinHearingPopupComponent', () => {
    let component: ConfirmJoinHearingPopupComponent;
    let focusServiceSpy: jasmine.SpyObj<FocusService>;
    const muteMicrophoneFormSpy = jasmine.createSpyObj('MuteMicrophoneComponent', ['save']);

    beforeEach(() => {
        focusServiceSpy = jasmine.createSpyObj<FocusService>('FocusService', ['restoreFocus']);
        component = new ConfirmJoinHearingPopupComponent(focusServiceSpy);
        component.muteMicrophoneForm = muteMicrophoneFormSpy;
        muteMicrophoneFormSpy.save.calls.reset();
    });

    describe('respondWithYes', () => {
        it('should save mute microphone', () => {
            const popupAnsweredSpy = spyOn(component.popupAnswered, 'emit');
            component.respondWithYes();
            expect(muteMicrophoneFormSpy.save).toHaveBeenCalled();
            expect(popupAnsweredSpy).toHaveBeenCalledWith(true);
        });
    });
});
