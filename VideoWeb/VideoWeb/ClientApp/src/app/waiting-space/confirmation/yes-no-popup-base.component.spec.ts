import { YesNoPopupBaseDirective } from './yes-no-popup-base.component';

class YesNoPopupBaseTest extends YesNoPopupBaseDirective {}

describe('YesNoPopupBaseComponent', () => {
    let component: YesNoPopupBaseDirective;
    beforeEach(() => {
        component = new YesNoPopupBaseTest();
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
});
