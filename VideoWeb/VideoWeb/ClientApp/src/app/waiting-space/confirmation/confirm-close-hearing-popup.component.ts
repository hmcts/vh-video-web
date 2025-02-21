import { Component } from '@angular/core';
import { YesNoPopupBaseDirective } from '../../shared/confirmation/yes-no-popup-base.component';
import { FocusService } from 'src/app/services/focus.service';

@Component({
    standalone: false,
    selector: 'app-confirm-close-hearing-popup',
    templateUrl: './confirm-close-hearing-popup.component.html',
    styleUrls: ['../../shared/confirmation/yes-no-popup-base.component.scss']
})
export class ConfirmCloseHearingPopupComponent extends YesNoPopupBaseDirective {
    constructor(protected focusService: FocusService) {
        super(focusService);
        this.modalDivId = 'confirmationDialog';
    }
}
