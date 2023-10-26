import { Component, Input } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { YesNoPopupBaseDirective } from './yes-no-popup-base.component';
import { FormBuilder, FormControl } from '@angular/forms';
import { UserMediaService } from 'src/app/services/user-media.service';

@Component({
    selector: 'app-confirm-start-hearing-popup',
    templateUrl: './confirm-start-hearing-popup.component.html',
    styleUrls: ['./yes-no-popup-base.component.scss']
})
export class ConfirmStartHearingPopupComponent extends YesNoPopupBaseDirective {
    @Input() hearingStarted = false;

    form = this.formBuilder.group({
        muteMicrophone: new FormControl(false)
    });

    constructor(
        protected translateService: TranslateService,
        private formBuilder: FormBuilder,
        private userMediaService: UserMediaService
    ) {
        super();

        this.form.reset({
            muteMicrophone: this.userMediaService.startAudioMuted
        });
    }

    get action(): string {
        return this.hearingStarted
            ? this.translateService.instant('confirm-start-hearing-popup.resume')
            : this.translateService.instant('confirm-start-hearing-popup.start');
    }

    respondWithYes(): void {
        this.userMediaService.startAudioMuted = this.form.value.muteMicrophone;

        super.respondWithYes();
    }
}
