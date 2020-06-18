import { Component, EventEmitter, Output } from '@angular/core';
import { ConsultationService } from 'src/app/services/api/consultation.service';
@Component({
    selector: 'app-consultation-error',
    templateUrl: './consultation-error.component.html'
})
export class ConsultationErrorComponent {
    @Output() closedModal = new EventEmitter<string>();
    constructor() {}

    closeModal() {
        this.closedModal.emit(ConsultationService.ERROR_PC_MODAL);
    }
}
