import { ConfirmCloseHearingPopupComponent } from './confirm-close-hearing-popup.component';

describe('ConfirmCloseHearingPopupComponent', () => {
    let component: ConfirmCloseHearingPopupComponent;

    beforeEach(() => {
        component = new ConfirmCloseHearingPopupComponent();
        spyOn(component.closeHearingAnswer, 'emit');
    });

    it('should emit true on confirm', () => {
        component.confirmCloseHearing();
        expect(component.closeHearingAnswer.emit).toHaveBeenCalledWith(true);
    });

    it('should emit false on cancel', () => {
        component.keepHearingOpen();
        expect(component.closeHearingAnswer.emit).toHaveBeenCalledWith(false);
    });
});
