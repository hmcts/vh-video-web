import { Component, EventEmitter, Input, Output } from '@angular/core';
import { YesNoPopupBaseDirective } from '../../shared/confirmation/yes-no-popup-base.component';

@Component({
    selector: 'app-warn-join-hearing-popup',
    templateUrl: './warn-join-hearing-popup.component.html',
    styleUrls: ['../../shared/confirmation/yes-no-popup-base.component.scss']
})
export class WarnJoinHearingPopupComponent extends YesNoPopupBaseDirective {
    @Input() hearingStartTime: Date;
    @Output() popupAnswered = new EventEmitter<boolean>();

    submit(): void {
        this.popupAnswered.emit(true);
    }
}
