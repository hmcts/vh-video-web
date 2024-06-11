import { FocusService } from 'src/app/services/focus.service';
import { ConfirmSelfTestPopupComponent } from './confirm-self-test-popup.component';

describe('ConfirmSelfTestPopupComponent', () => {
    let focusServiceSpy: jasmine.SpyObj<FocusService>;
    let component: ConfirmSelfTestPopupComponent;

    beforeEach(() => {
        focusServiceSpy = jasmine.createSpyObj<FocusService>('FocusService', ['restoreFocus']);
        component = new ConfirmSelfTestPopupComponent(focusServiceSpy);
    });

    it('should emit true when submit is called', () => {
        spyOn(component.popupAnswered, 'emit');
        component.submit();
        expect(component.popupAnswered.emit).toHaveBeenCalledWith(true);
    });
});
