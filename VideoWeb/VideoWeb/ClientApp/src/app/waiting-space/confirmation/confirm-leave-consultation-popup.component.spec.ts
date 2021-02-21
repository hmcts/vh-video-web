import { ConfirmLeaveConsultationPopupComponent } from './confirm-leave-consultation-popup.component';

describe('YesNoPopupBaseComponent', () => {
    let component: ConfirmLeaveConsultationPopupComponent;
    beforeEach(() => {
        component = new ConfirmLeaveConsultationPopupComponent();
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
