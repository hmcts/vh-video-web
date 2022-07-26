import { AfterViewInit, Component, EventEmitter, Output } from '@angular/core';
import { ModalTrapFocus } from '../../../shared/modal/modal-trap-focus';
import { Constants } from '../../../shared/constants/div-ids';
@Component({
    selector: 'app-consultation-leave',
    templateUrl: './consultation-leave.component.html',
    styleUrls: ['./consultation-leave.component.scss']
})
export class ConsultationLeaveComponent implements AfterViewInit {
    @Output() closedModal = new EventEmitter();
    @Output() leave = new EventEmitter();

    constructor() {}

    ngAfterViewInit(): void {
        ModalTrapFocus.trap(Constants.CONSULATION_LEAVE_MODAL);
    }

    closeModal() {
        this.closedModal.emit();
    }

    leaveConsultation() {
        this.leave.emit();
        this.closeModal();
    }
}
