import { Component, EventEmitter, Output } from '@angular/core';
@Component({
    selector: 'app-consultation-error',
    templateUrl: './consultation-error.component.html'
})
export class ConsultationErrorComponent {
    @Output() closedModal = new EventEmitter();
    constructor() {}

    closeModal() {
        this.closedModal.emit();
    }
}
