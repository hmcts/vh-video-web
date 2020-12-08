import { Component, Input } from '@angular/core';
import { YesNoPopupBaseDirective } from './yes-no-popup-base.component';

@Component({
    selector: 'app-confirm-start-hearing-popup',
    templateUrl: './confirm-start-hearing-popup.component.html',
    styleUrls: ['./yes-no-popup-base.component.scss']
})
export class ConfirmStartHearingPopupComponent extends YesNoPopupBaseDirective {
    @Input() hearingStarted = false;

    get action(): string {
        return this.hearingStarted ? 'resume' : 'start';
    }
}
