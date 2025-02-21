import { AfterViewInit, Component, Input } from '@angular/core';
import { YesNoPopupBaseDirective } from 'src/app/shared/confirmation/yes-no-popup-base.component';
import { FocusService } from 'src/app/services/focus.service';
import { VHConference } from '../store/models/vh-conference';

@Component({
    standalone: false,
    selector: 'app-change-hearing-layout-popup',
    templateUrl: './change-hearing-layout-popup.component.html',
    styleUrls: ['../../shared/confirmation/yes-no-popup-base.component.scss']
})
export class ChangeHearingLayoutPopupComponent extends YesNoPopupBaseDirective implements AfterViewInit {
    @Input() conference: VHConference;
    @Input() onLayoutUpdate: Function;

    constructor(protected focusService: FocusService) {
        super(focusService);
        this.modalDivId = 'change-hearing-layout-modal';
    }

    closePopup() {
        this.popupAnswered.emit(false);
    }
}
