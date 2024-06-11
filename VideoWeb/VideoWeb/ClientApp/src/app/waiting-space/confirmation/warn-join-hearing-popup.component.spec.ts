import { FocusService } from 'src/app/services/focus.service';
import { WarnJoinHearingPopupComponent } from './warn-join-hearing-popup.component';

describe('WarnJoinHearingPopupComponent', () => {
    let focusServiceSpy: jasmine.SpyObj<FocusService>;
    let component: WarnJoinHearingPopupComponent;

    beforeEach(() => {
        focusServiceSpy = jasmine.createSpyObj<FocusService>('FocusService', ['restoreFocus']);
        component = new WarnJoinHearingPopupComponent(focusServiceSpy);
    });

    it('should emit true when submit is called', () => {
        spyOn(component.popupAnswered, 'emit');
        component.submit();
        expect(component.popupAnswered.emit).toHaveBeenCalledWith(true);
    });
});
