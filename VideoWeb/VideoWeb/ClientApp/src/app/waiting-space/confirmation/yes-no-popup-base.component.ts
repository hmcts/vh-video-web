import { Directive, EventEmitter, Output } from '@angular/core';

@Directive()
export abstract class YesNoPopupBaseDirective {
    @Output() popupAnswered = new EventEmitter<boolean>();

    respondWithYes() {
        this.popupAnswered.emit(true);
    }

    respondWithNo() {
        this.popupAnswered.emit(false);
    }
}
