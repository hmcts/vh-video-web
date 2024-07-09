import { Component, Input, ViewChild } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { YesNoPopupBaseDirective } from '../../shared/confirmation/yes-no-popup-base.component';
import { FocusService } from 'src/app/services/focus.service';
import { MuteMicrophoneComponent } from '../mute-microphone/mute-microphone.component';

@Component({
    selector: 'app-confirm-start-hearing-popup',
    templateUrl: './confirm-start-hearing-popup.component.html',
    styleUrls: ['../../shared/confirmation/yes-no-popup-base.component.scss']
})
export class ConfirmStartHearingPopupComponent extends YesNoPopupBaseDirective {
    @ViewChild(MuteMicrophoneComponent) muteMicrophoneForm: MuteMicrophoneComponent;
    @Input() hearingStarted = false;
    @Input() hearingId: string;
    @Input() hasAMicrophone = true;

    constructor(
        protected translateService: TranslateService,
        protected focusService: FocusService
    ) {
        super(focusService);
        this.modalDivId = 'confirmationDialog';
    }

    get action(): string {
        return this.hearingStarted
            ? this.translateService.instant('confirm-start-hearing-popup.resume')
            : this.translateService.instant('confirm-start-hearing-popup.start');
    }

    respondWithYes() {
        this.muteMicrophoneForm.save();
        super.respondWithYes();
    }
}
