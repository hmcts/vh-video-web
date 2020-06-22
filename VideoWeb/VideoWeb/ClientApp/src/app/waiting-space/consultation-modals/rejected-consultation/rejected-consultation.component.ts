import { Component, EventEmitter, Output } from '@angular/core';

@Component({
    selector: 'app-rejected-consultation',
    templateUrl: './rejected-consultation.component.html'
})
export class RejectedConsultationComponent {
    @Output() closedModal = new EventEmitter();
    constructor() {}

    closeModal() {
        this.closedModal.emit();
    }
}
