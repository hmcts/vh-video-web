import { AfterViewInit, Directive, EventEmitter, Output } from '@angular/core';
import { ModalTrapFocus } from 'src/app/shared/modal/modal-trap-focus';

@Directive()
export abstract class YesNoPopupBaseDirective implements AfterViewInit {
    modalDivId: string;
    @Output() popupAnswered = new EventEmitter<boolean>();

    ngAfterViewInit(): void {
        ModalTrapFocus.trap(this.modalDivId);
    }

    respondWithYes() {
        this.popupAnswered.emit(true);
    }

    respondWithNo() {
        this.popupAnswered.emit(false);
    }
}
