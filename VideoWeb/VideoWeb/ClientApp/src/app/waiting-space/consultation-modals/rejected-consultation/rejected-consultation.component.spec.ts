import { RejectedConsultationComponent } from './rejected-consultation.component';

describe('RejectedConsultationComponent', () => {
    let component: RejectedConsultationComponent;
    beforeEach(() => {
        component = new RejectedConsultationComponent();
    });

    it('should emit modal closed', () => {
        spyOn(component.closedModal, 'emit');
        component.closeModal();
        expect(component.closedModal.emit).toHaveBeenCalled();
    });
});
