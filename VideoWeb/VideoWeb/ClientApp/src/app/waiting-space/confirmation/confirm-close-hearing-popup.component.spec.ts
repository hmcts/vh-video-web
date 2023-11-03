import { FocusService } from 'src/app/services/focus.service';
import { ConfirmCloseHearingPopupComponent } from './confirm-close-hearing-popup.component';

describe('ConfirmCloseHearingPopupComponent', () => {
    let component: ConfirmCloseHearingPopupComponent;
    let focusServiceSpy: jasmine.SpyObj<FocusService>;

    beforeEach(() => {
        focusServiceSpy = jasmine.createSpyObj<FocusService>('FocusService', ['restoreFocus']);
        component = new ConfirmCloseHearingPopupComponent(focusServiceSpy);
    });

    it('should set modalDivId to confirmationDialog', () => {
        expect(component.modalDivId).toEqual('confirmationDialog');
    });
});
