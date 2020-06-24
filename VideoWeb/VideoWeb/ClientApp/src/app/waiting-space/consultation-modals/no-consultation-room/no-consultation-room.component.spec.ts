import { NoConsultationRoomComponent } from './no-consultation-room.component';

describe('NoConsultationRoomComponent', () => {
    let component: NoConsultationRoomComponent;

    beforeEach(() => {
        component = new NoConsultationRoomComponent();
    });

    it('should emit closed modal with modal name', () => {
        spyOn(component.closedModal, 'emit');
        component.closeModal();
        expect(component.closedModal.emit).toHaveBeenCalled();
    });
});
