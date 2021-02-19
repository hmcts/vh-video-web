import { Component, EventEmitter, Output } from '@angular/core';
@Component({
    selector: 'app-consultation-leave',
    templateUrl: './consultation-leave.component.html',
    styleUrls: ['./consultation-leave.component.scss']
})
export class ConsultationLeaveComponent {
    @Output() closedModal = new EventEmitter();
    @Output() leave = new EventEmitter();

    constructor() {}

    closeModal() {
        this.closedModal.emit();
    }

    leaveConsultation() {
        this.leave.emit();
        this.closeModal();
    }
}
