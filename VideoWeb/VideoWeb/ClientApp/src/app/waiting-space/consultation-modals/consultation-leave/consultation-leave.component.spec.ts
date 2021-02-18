import { ConsultationLeaveComponent } from './consultation-leave.component';

describe('ConsultationLeaveComponent', () => {
    let component: ConsultationLeaveComponent;

    beforeEach(() => {
        component = new ConsultationLeaveComponent();
    });
    
    it('should emit leave', () => {
        // Arrange
        spyOn(component.leave, 'emit');
        spyOn(component.closedModal, 'emit');

        // Act
        component.leaveConsultation();

        // Assert
        expect(component.leave.emit).toHaveBeenCalled();
        expect(component.closedModal.emit).toHaveBeenCalled();
    });

    it('should emit closed modal with modal name', () => {
        // Arrange
        spyOn(component.closedModal, 'emit');

        // ACT
        component.closeModal();
        
        // Assert
        expect(component.closedModal.emit).toHaveBeenCalled();
    });
});
