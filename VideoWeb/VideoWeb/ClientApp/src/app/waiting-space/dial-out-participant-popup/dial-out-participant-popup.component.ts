import { AfterViewInit, Component } from '@angular/core';
import { FocusService } from 'src/app/services/focus.service';
import { YesNoPopupBaseDirective } from 'src/app/shared/confirmation/yes-no-popup-base.component';

@Component({
    selector: 'app-dial-out-participant-popup',
    templateUrl: './dial-out-participant-popup.component.html',
    styleUrl: '../../shared/confirmation/yes-no-popup-base.component.scss'
})
export class DialOutParticipantPopupComponent extends YesNoPopupBaseDirective implements AfterViewInit {
    constructor(protected focusService: FocusService) {
        super(focusService);
        this.modalDivId = 'dial-participant-modal';
    }

    closePopup() {
        this.popupAnswered.emit(false);
    }
}
