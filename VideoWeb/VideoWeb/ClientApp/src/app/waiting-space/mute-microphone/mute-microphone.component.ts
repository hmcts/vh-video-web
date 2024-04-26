import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormControl } from '@angular/forms';
import { UserMediaService } from 'src/app/services/user-media.service';

@Component({
    selector: 'app-mute-microphone',
    templateUrl: './mute-microphone.component.html'
})
export class MuteMicrophoneComponent implements OnInit {
    @Input() hearingId: string;

    form = this.formBuilder.group({
        muteMicrophone: new FormControl(false)
    });

    constructor(
        private formBuilder: FormBuilder,
        private userMediaService: UserMediaService
    ) {}

    ngOnInit() {
        this.userMediaService.removeExpiredConferenceSettings();
        this.initialiseForm();
    }

    save() {
        this.userMediaService.updateStartWithAudioMuted(this.hearingId, this.form.value.muteMicrophone);
    }

    private initialiseForm(): void {
        const conferenceSetting = this.userMediaService.getConferenceSetting(this.hearingId);
        this.form.reset({
            muteMicrophone: conferenceSetting?.startWithAudioMuted ?? false
        });
    }
}
