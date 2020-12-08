import { Component } from '@angular/core';
import { YesNoPopupBaseDirective } from './yes-no-popup-base.component';

@Component({
    selector: 'app-confirm-close-hearing-popup',
    templateUrl: './confirm-close-hearing-popup.component.html',
    styleUrls: ['./yes-no-popup-base.component.scss']
})
export class ConfirmCloseHearingPopupComponent extends YesNoPopupBaseDirective {}
