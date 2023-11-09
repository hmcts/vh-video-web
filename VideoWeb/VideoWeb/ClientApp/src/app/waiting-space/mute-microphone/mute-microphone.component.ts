import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormControl } from '@angular/forms';
import { UserMediaService } from 'src/app/services/user-media.service';

@Component({
    selector: 'app-mute-microphone',
    templateUrl: './mute-microphone.component.html'
})
export class MuteMicrophoneComponent implements OnInit {
    @Input() hearingId: string;
    @Input() confirmButtonText: string;
    @Input() confirmButtonLabel: string;
    @Input() cancelButtonLabel: string;
    @Output() confirmAnswered = new EventEmitter<boolean>();

    form = this.formBuilder.group({
        muteMicrophone: new FormControl(false)
    });

    constructor(private formBuilder: FormBuilder, private userMediaService: UserMediaService) {}

    ngOnInit() {
        this.initialiseForm();
    }

    confirm() {
        this.userMediaService.updateStartWithAudioMuted(this.hearingId, this.form.value.muteMicrophone);

        this.confirmAnswered.emit(true);
    }

    cancel() {
        this.confirmAnswered.emit(false);
    }

    private initialiseForm(): void {
        const conferenceSetting = this.userMediaService.getConferenceSetting(this.hearingId);
        this.form.reset({
            muteMicrophone: conferenceSetting?.startWithAudioMuted ?? false
        });
    }
}
