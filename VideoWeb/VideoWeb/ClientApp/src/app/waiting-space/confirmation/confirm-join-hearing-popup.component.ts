import { Component, Input } from '@angular/core';
import { YesNoPopupBaseDirective } from './yes-no-popup-base.component';
import { FEATURE_FLAGS, LaunchDarklyService } from 'src/app/services/launch-darkly.service';

@Component({
    selector: 'app-confirm-join-hearing-popup',
    templateUrl: './confirm-join-hearing-popup.component.html',
    styleUrls: ['./yes-no-popup-base.component.scss']
})
export class ConfirmJoinHearingPopupComponent extends YesNoPopupBaseDirective {
    @Input() hearingId: string;

    isMuteMicrophoneEnabled = false;

    constructor(launchDarklyService: LaunchDarklyService) {
        super();

        launchDarklyService.getFlag<boolean>(FEATURE_FLAGS.hostMuteMicrophone, false).subscribe(value => {
            this.isMuteMicrophoneEnabled = value;
        });
    }

    onConfirmAnswered(actionConfirmed: boolean) {
        if (actionConfirmed) {
            this.respondWithYes();
        } else {
            this.respondWithNo();
        }
    }
}
