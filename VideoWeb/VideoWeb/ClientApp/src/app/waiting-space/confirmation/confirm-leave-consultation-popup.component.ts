import { Component } from '@angular/core';
import { YesNoPopupBaseDirective } from './yes-no-popup-base.component';

@Component({
    selector: 'app-confirm-leave-consultation-popup',
    templateUrl: './confirm-leave-consultation-popup.component.html',
    styleUrls: ['./yes-no-popup-base.component.scss']
})
export class ConfirmLeaveConsultationPopupComponent extends YesNoPopupBaseDirective {}
