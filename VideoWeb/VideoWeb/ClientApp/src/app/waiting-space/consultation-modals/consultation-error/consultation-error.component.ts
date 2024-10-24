import { Component, EventEmitter, Output } from '@angular/core';
import { ConsultationService } from 'src/app/services/api/consultation.service';
@Component({
    selector: 'app-consultation-error',
    templateUrl: './consultation-error.component.html'
})
export class ConsultationErrorComponent {
    @Output() closedModal = new EventEmitter();

    consultationError$ = this.consultationService.consultationError$;

    constructor(private consultationService: ConsultationService) {}

    closeModal() {
        this.closedModal.emit();
    }
}
