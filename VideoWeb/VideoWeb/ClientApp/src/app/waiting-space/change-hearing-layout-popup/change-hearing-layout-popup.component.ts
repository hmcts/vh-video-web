import { AfterViewInit, Component, Input } from '@angular/core';
import { ConferenceResponse } from '../../services/clients/api-client';
import { YesNoPopupBaseDirective } from 'src/app/shared/confirmation/yes-no-popup-base.component';
import { FocusService } from 'src/app/services/focus.service';

@Component({
    selector: 'app-change-hearing-layout-popup',
    templateUrl: './change-hearing-layout-popup.component.html',
    styleUrls: ['../../shared/confirmation/yes-no-popup-base.component.scss']
})
export class ChangeHearingLayoutPopupComponent extends YesNoPopupBaseDirective implements AfterViewInit {
    @Input() conference: ConferenceResponse;
    @Input() onLayoutUpdate: Function;

    constructor(protected focusService: FocusService) {
        super(focusService);
        this.modalDivId = 'change-hearing-layout-modal';
    }

    closePopup() {
        this.popupAnswered.emit(false);
    }
}
