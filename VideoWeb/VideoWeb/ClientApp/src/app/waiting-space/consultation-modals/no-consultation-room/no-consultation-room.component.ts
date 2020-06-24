import { Component, EventEmitter, Output } from '@angular/core';

@Component({
    selector: 'app-no-consultation-room',
    templateUrl: './no-consultation-room.component.html'
})
export class NoConsultationRoomComponent {
    @Output() closedModal = new EventEmitter();
    constructor() {}

    closeModal() {
        this.closedModal.emit();
    }
}
