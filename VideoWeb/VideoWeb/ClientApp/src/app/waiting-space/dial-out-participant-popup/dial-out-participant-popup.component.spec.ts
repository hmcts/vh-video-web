import { DialOutParticipantPopupComponent } from './dial-out-participant-popup.component';

describe('DialOutParticipantPopupComponent', () => {
    let component: DialOutParticipantPopupComponent;
    const focusServiceSpy = jasmine.createSpyObj('FocusService', ['focus']);

    beforeEach(async () => {
        component = new DialOutParticipantPopupComponent(focusServiceSpy);
    });

    it('should set modalDivId to dial-out-participant-modal', () => {
        expect(component.modalDivId).toEqual('dial-out-participant-modal');
    });

    it('should emit closeButtonPressed event when closePopup is called', () => {
        spyOn(component.popupAnswered, 'emit');
        component.closePopup();

        expect(component.popupAnswered.emit).toHaveBeenCalled();
    });
});
