import { Component, Input } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { YesNoPopupBaseDirective } from './yes-no-popup-base.component';
import { FormBuilder, FormControl } from '@angular/forms';

@Component({
    selector: 'app-confirm-start-hearing-popup',
    templateUrl: './confirm-start-hearing-popup.component.html',
    styleUrls: ['./yes-no-popup-base.component.scss']
})
export class ConfirmStartHearingPopupComponent extends YesNoPopupBaseDirective {
    @Input() hearingStarted = false;

    readonly START_AUDIO_MUTED_KEY = 'vh.start-audio-muted';

    form = this.formBuilder.group({
        muteMicrophone: new FormControl(false)
    });

    constructor(protected translateService: TranslateService, private formBuilder: FormBuilder) {
        super();

        this.form.reset({
            muteMicrophone: this.startAudioMuted
        });
    }

    get action(): string {
        return this.hearingStarted
            ? this.translateService.instant('confirm-start-hearing-popup.resume')
            : this.translateService.instant('confirm-start-hearing-popup.start');
    }

    private get startAudioMuted(): boolean {
        return localStorage.getItem(this.START_AUDIO_MUTED_KEY) === 'true';
    }

    private set startAudioMuted(value: boolean) {
        localStorage.setItem(this.START_AUDIO_MUTED_KEY, value.toString());
    }

    respondWithYes(): void {
        this.startAudioMuted = this.form.value.muteMicrophone;

        super.respondWithYes();
    }
}
