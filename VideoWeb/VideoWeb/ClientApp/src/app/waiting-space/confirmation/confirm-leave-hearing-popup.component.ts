import { Component } from '@angular/core';
import { YesNoPopupBaseDirective } from './yes-no-popup-base.component';

@Component({
    selector: 'app-confirm-leave-hearing-popup',
    templateUrl: './confirm-leave-hearing-popup.component.html',
    styleUrls: ['./yes-no-popup-base.component.scss']
})
export class ConfirmLeaveHearingPopupComponent extends YesNoPopupBaseDirective {}
