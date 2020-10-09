import { Component, EventEmitter, Output } from '@angular/core';

@Component({
    selector: 'app-confirm-close-hearing-popup',
    templateUrl: './confirm-close-hearing-popup.component.html',
    styleUrls: ['./confirm-close-hearing-popup.component.scss']
})
export class ConfirmCloseHearingPopupComponent {
    @Output() closeHearingAnswer = new EventEmitter<boolean>();

    confirmCloseHearing() {
        this.closeHearingAnswer.emit(true);
    }

    keepHearingOpen() {
        this.closeHearingAnswer.emit(false);
    }
}
