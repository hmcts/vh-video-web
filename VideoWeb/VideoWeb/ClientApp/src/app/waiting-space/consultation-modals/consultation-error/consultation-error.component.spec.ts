import { ConsultationErrorComponent } from './consultation-error.component';

describe('ConsultationErrorComponent', () => {
    let component: ConsultationErrorComponent;

    beforeEach(() => {
        component = new ConsultationErrorComponent();
    });

    it('should emit closed modal with modal name', () => {
        spyOn(component.closedModal, 'emit');
        component.closeModal();
        expect(component.closedModal.emit).toHaveBeenCalled();
    });
});
