import { Component, Input } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { YesNoPopupBaseDirective } from './yes-no-popup-base.component';
import { FEATURE_FLAGS, LaunchDarklyService } from 'src/app/services/launch-darkly.service';

@Component({
    selector: 'app-confirm-start-hearing-popup',
    templateUrl: './confirm-start-hearing-popup.component.html',
    styleUrls: ['./yes-no-popup-base.component.scss']
})
export class ConfirmStartHearingPopupComponent extends YesNoPopupBaseDirective {
    @Input() hearingStarted = false;
    @Input() hearingId: string;

    isMuteMicrophoneEnabled = false;

    constructor(protected translateService: TranslateService, launchDarklyService: LaunchDarklyService) {
        super();

        launchDarklyService.getFlag<boolean>(FEATURE_FLAGS.hostMuteMicrophone, false).subscribe(value => {
            this.isMuteMicrophoneEnabled = value;
        });
    }

    get action(): string {
        return this.hearingStarted
            ? this.translateService.instant('confirm-start-hearing-popup.resume')
            : this.translateService.instant('confirm-start-hearing-popup.start');
    }

    onConfirmAnswered(actionConfirmed: boolean): void {
        if (actionConfirmed) {
            this.respondWithYes();
        } else {
            this.respondWithNo();
        }
    }
}
