import { ConsultationService } from 'src/app/services/api/consultation.service';
import { NoConsultationRoomComponent } from './no-consultation-room.component';

describe('NoConsultationRoomComponent', () => {
    let component: NoConsultationRoomComponent;

    beforeEach(() => {
        component = new NoConsultationRoomComponent();
    });

    it('should emit closed modal with modal name', () => {
        spyOn(component.closedModal, 'emit');

        component.closeModal();

        expect(component.closedModal.emit).toHaveBeenCalledWith(ConsultationService.NO_ROOM_PC_MODAL);
    });
});
