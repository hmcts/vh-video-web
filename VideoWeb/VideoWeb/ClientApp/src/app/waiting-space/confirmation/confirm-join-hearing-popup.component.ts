import { Component, Input, ViewChild } from '@angular/core';
import { YesNoPopupBaseDirective } from '../../shared/confirmation/yes-no-popup-base.component';
import { FEATURE_FLAGS, LaunchDarklyService } from 'src/app/services/launch-darkly.service';
import { MuteMicrophoneComponent } from '../mute-microphone/mute-microphone.component';
import { FocusService } from 'src/app/services/focus.service';

@Component({
    selector: 'app-confirm-join-hearing-popup',
    templateUrl: './confirm-join-hearing-popup.component.html',
    styleUrls: ['../../shared/confirmation/yes-no-popup-base.component.scss']
})
export class ConfirmJoinHearingPopupComponent extends YesNoPopupBaseDirective {
    @ViewChild(MuteMicrophoneComponent) muteMicrophoneForm: MuteMicrophoneComponent;
    @Input() hearingId: string;

    isMuteMicrophoneEnabled = false;

    constructor(
        launchDarklyService: LaunchDarklyService,
        protected focusService: FocusService
    ) {
        super(focusService);
        this.modalDivId = 'confirmationDialog';

        launchDarklyService.getFlag<boolean>(FEATURE_FLAGS.hostMuteMicrophone, false).subscribe(value => {
            this.isMuteMicrophoneEnabled = value;
        });
    }

    respondWithYes() {
        if (this.isMuteMicrophoneEnabled) {
            this.muteMicrophoneForm.save();
        }
        super.respondWithYes();
    }
}
