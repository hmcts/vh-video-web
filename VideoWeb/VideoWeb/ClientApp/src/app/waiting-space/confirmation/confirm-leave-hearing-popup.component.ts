import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';
import { YesNoPopupBaseDirective } from '../../shared/confirmation/yes-no-popup-base.component';
import { ModalTrapFocus } from '../../shared/modal/modal-trap-focus';

@Component({
    standalone: false,
    selector: 'app-confirm-leave-hearing-popup',
    templateUrl: './confirm-leave-hearing-popup.component.html',
    styleUrls: ['../../shared/confirmation/yes-no-popup-base.component.scss']
})
export class ConfirmLeaveHearingPopupComponent extends YesNoPopupBaseDirective implements AfterViewInit {
    @ViewChild('btnConfirmStartRef') btnLeave: ElementRef;

    private readonly LEAVE_MODAL = 'confirm-leave-hearing-modal';

    ngAfterViewInit(): void {
        ModalTrapFocus.trap(this.LEAVE_MODAL);
        this.btnLeave.nativeElement.focus();
    }
}
