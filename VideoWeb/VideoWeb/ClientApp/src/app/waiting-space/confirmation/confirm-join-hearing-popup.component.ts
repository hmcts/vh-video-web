import { Component, Input, ViewChild } from '@angular/core';
import { YesNoPopupBaseDirective } from '../../shared/confirmation/yes-no-popup-base.component';
import { MuteMicrophoneComponent } from '../mute-microphone/mute-microphone.component';
import { FocusService } from 'src/app/services/focus.service';

@Component({
    standalone: false,
    selector: 'app-confirm-join-hearing-popup',
    templateUrl: './confirm-join-hearing-popup.component.html',
    styleUrls: ['../../shared/confirmation/yes-no-popup-base.component.scss']
})
export class ConfirmJoinHearingPopupComponent extends YesNoPopupBaseDirective {
    @ViewChild(MuteMicrophoneComponent) muteMicrophoneForm: MuteMicrophoneComponent;
    @Input() hearingId: string;

    constructor(protected focusService: FocusService) {
        super(focusService);
        this.modalDivId = 'confirmationDialog';
    }

    respondWithYes() {
        this.muteMicrophoneForm.save();
        super.respondWithYes();
    }
}
