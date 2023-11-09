import { FEATURE_FLAGS, LaunchDarklyService } from 'src/app/services/launch-darkly.service';
import { of } from 'rxjs';
import { ConfirmJoinHearingPopupComponent } from './confirm-join-hearing-popup.component';

describe('ConfirmJoinHearingPopupComponent', () => {
    let component: ConfirmJoinHearingPopupComponent;
    const launchDarklyServiceSpy = jasmine.createSpyObj<LaunchDarklyService>(['getFlag']);

    beforeEach(() => {
        launchDarklyServiceSpy.getFlag.withArgs(FEATURE_FLAGS.hostMuteMicrophone, false).and.returnValue(of(true));
        component = new ConfirmJoinHearingPopupComponent(launchDarklyServiceSpy);
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
