import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';
import { YesNoPopupBaseDirective } from './yes-no-popup-base.component';
import { ModalTrapFocus } from '../../shared/modal/modal-trap-focus';

@Component({
    selector: 'app-confirm-leave-hearing-popup',
    templateUrl: './confirm-leave-hearing-popup.component.html',
    styleUrls: ['./yes-no-popup-base.component.scss']
})
export class ConfirmLeaveHearingPopupComponent extends YesNoPopupBaseDirective implements AfterViewInit {
    private readonly LEAVE_MODAL = 'confirm-leave-hearing-modal';

    @ViewChild('btnConfirmStartRef') btnLeave: ElementRef;

    ngAfterViewInit(): void {
        ModalTrapFocus.trap(this.LEAVE_MODAL);
        this.btnLeave.nativeElement.focus();
    }
}
