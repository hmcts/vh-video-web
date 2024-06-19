import { FocusService } from 'src/app/services/focus.service';
import { WarnJoinHearingPopupComponent } from './warn-join-hearing-popup.component';
import { NotificationSoundsService } from '../services/notification-sounds.service';

describe('WarnJoinHearingPopupComponent', () => {
    let focusServiceSpy: jasmine.SpyObj<FocusService>;
    let notificationSoundServiceSpy: jasmine.SpyObj<NotificationSoundsService>;
    let component: WarnJoinHearingPopupComponent;

    beforeEach(() => {
        focusServiceSpy = jasmine.createSpyObj<FocusService>('FocusService', ['restoreFocus']);
        notificationSoundServiceSpy = jasmine.createSpyObj<NotificationSoundsService>('NotificationSoundsService', [
            'initHearingAlertSound',
            'initConsultationRequestRingtone'
        ]);
        component = new WarnJoinHearingPopupComponent(focusServiceSpy, notificationSoundServiceSpy);
    });

    it('should emit true when submit is called', () => {
        spyOn(component.popupAnswered, 'emit');
        component.submit();
        expect(component.popupAnswered.emit).toHaveBeenCalledWith(true);
        expect(notificationSoundServiceSpy.initHearingAlertSound).toHaveBeenCalled();
        expect(notificationSoundServiceSpy.initConsultationRequestRingtone).toHaveBeenCalled();
    });
});
