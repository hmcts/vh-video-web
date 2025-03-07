import { AfterViewInit, Component, EventEmitter, Output } from '@angular/core';
import { ModalTrapFocus } from '../../../shared/modal/modal-trap-focus';
import { FocusService } from 'src/app/services/focus.service';
@Component({
    standalone: false,
    selector: 'app-consultation-leave',
    templateUrl: './consultation-leave.component.html',
    styleUrls: ['./consultation-leave.component.scss']
})
export class ConsultationLeaveComponent implements AfterViewInit {
    @Output() closedModal = new EventEmitter();
    @Output() leave = new EventEmitter();

    private readonly CONSULATION_LEAVE_MODAL = 'modal-window-confirmation';

    constructor(private focusService: FocusService) {}

    ngAfterViewInit(): void {
        ModalTrapFocus.trap(this.CONSULATION_LEAVE_MODAL);
    }

    closeModal() {
        this.focusService.restoreFocus();
        this.closedModal.emit();
    }

    leaveConsultation() {
        this.leave.emit();
        this.closeModal();
    }
}
