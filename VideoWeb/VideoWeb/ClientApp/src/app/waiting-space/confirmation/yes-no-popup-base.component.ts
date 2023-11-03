import { AfterViewInit, Directive, EventEmitter, Output } from '@angular/core';
import { FocusService } from 'src/app/services/focus.service';
import { ModalTrapFocus } from 'src/app/shared/modal/modal-trap-focus';

@Directive()
export abstract class YesNoPopupBaseDirective implements AfterViewInit {
    @Output() popupAnswered = new EventEmitter<boolean>();

    modalDivId: string;

    constructor(protected focusService: FocusService) {}

    ngAfterViewInit(): void {
        if (this.modalDivId) {
            ModalTrapFocus.trap(this.modalDivId);
        }
    }

    respondWithYes() {
        this.popupAnswered.emit(true);
    }

    respondWithNo() {
        this.focusService.restoreFocus();
        this.popupAnswered.emit(false);
    }
}
