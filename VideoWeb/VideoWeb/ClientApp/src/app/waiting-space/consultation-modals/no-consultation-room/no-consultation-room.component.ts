import { Component, EventEmitter, Output } from '@angular/core';
import { ConsultationService } from 'src/app/services/api/consultation.service';

@Component({
    selector: 'app-no-consultation-room',
    templateUrl: './no-consultation-room.component.html'
})
export class NoConsultationRoomComponent {
    @Output() closedModal = new EventEmitter<string>();
    constructor() {
        console.log('NoConsultationRoomComponent');
    }

    closeModal() {
        this.closedModal.emit(ConsultationService.NO_ROOM_PC_MODAL);
    }
}
