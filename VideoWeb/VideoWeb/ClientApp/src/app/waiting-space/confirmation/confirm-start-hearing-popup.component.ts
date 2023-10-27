import { Component, Input } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { YesNoPopupBaseDirective } from './yes-no-popup-base.component';
import { FormBuilder, FormControl } from '@angular/forms';
import { UserMediaService } from 'src/app/services/user-media.service';
import { FEATURE_FLAGS, LaunchDarklyService } from 'src/app/services/launch-darkly.service';

@Component({
    selector: 'app-confirm-start-hearing-popup',
    templateUrl: './confirm-start-hearing-popup.component.html',
    styleUrls: ['./yes-no-popup-base.component.scss']
})
export class ConfirmStartHearingPopupComponent extends YesNoPopupBaseDirective {
    @Input() hearingStarted = false;

    isHostMuteMicrophoneEnabled = false;

    form = this.formBuilder.group({
        muteMicrophone: new FormControl(false)
    });

    constructor(
        protected translateService: TranslateService,
        private formBuilder: FormBuilder,
        private userMediaService: UserMediaService,
        launchDarklyService: LaunchDarklyService
    ) {
        super();

        launchDarklyService
            .getFlag<boolean>(FEATURE_FLAGS.hostMuteMicrophone, false)
            .subscribe(value => (this.isHostMuteMicrophoneEnabled = value));
    }

    ngOnInit(): void {
        if (this.hearingStarted && this.isHostMuteMicrophoneEnabled) {
            this.form.reset({
                muteMicrophone: this.userMediaService.startAudioMuted
            });
        }
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
