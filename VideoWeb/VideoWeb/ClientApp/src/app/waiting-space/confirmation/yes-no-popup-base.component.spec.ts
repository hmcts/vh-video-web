import { ModalTrapFocus } from 'src/app/shared/modal/modal-trap-focus';
import { YesNoPopupBaseDirective } from './yes-no-popup-base.component';

class YesNoPopupBaseTest extends YesNoPopupBaseDirective {}

describe('YesNoPopupBaseComponent', () => {
    let component: YesNoPopupBaseDirective;
    const focusServiceSpy = jasmine.createSpyObj('FocusService', ['restoreFocus']);
    beforeEach(() => {
        component = new YesNoPopupBaseTest(focusServiceSpy);
        spyOn(component.popupAnswered, 'emit');
    });

    it('should emit true on confirm', () => {
        component.respondWithYes();
        expect(component.popupAnswered.emit).toHaveBeenCalledWith(true);
    });

    it('should emit false on cancel', () => {
        component.respondWithNo();
        expect(component.popupAnswered.emit).toHaveBeenCalledWith(false);
    });

    it('should trap focus on modal after view init', () => {
        const modalDivId = 'test-modal';
        component.modalDivId = modalDivId;
        spyOn(ModalTrapFocus, 'trap');
        component.ngAfterViewInit();
        expect(ModalTrapFocus.trap).toHaveBeenCalledWith(modalDivId);
    });
});
