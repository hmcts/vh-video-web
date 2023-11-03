import { ConfirmCloseHearingPopupComponent } from './confirm-close-hearing-popup.component';

describe('ConfirmCloseHearingPopupComponent', () => {
    let component: ConfirmCloseHearingPopupComponent;

    beforeEach(() => {
        component = new ConfirmCloseHearingPopupComponent();
    });

    it('should set modalDivId to confirmationDialog', () => {
        expect(component.modalDivId).toEqual('confirmationDialog');
    });
});
