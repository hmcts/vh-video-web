import { Component, EventEmitter, Output } from '@angular/core';
import { YesNoPopupBaseDirective } from '../../confirmation/yes-no-popup-base.component';

@Component({
    selector: 'app-confirm-self-test-popup',
    templateUrl: './confirm-self-test-popup.component.html',
    styleUrls: ['../../confirmation/yes-no-popup-base.component.scss']
})
export class ConfirmSelfTestPopupComponent extends YesNoPopupBaseDirective {
    @Output() popupAnswered = new EventEmitter<boolean>();

    submit(): void {
        this.popupAnswered.emit(true);
    }
}
