import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { parsePhoneNumberFromString } from 'libphonenumber-js';
import { VideoCallService } from 'src/app/waiting-space/services/video-call.service';

@Component({
    standalone: false,
    selector: 'app-dial-out-number',
    templateUrl: './dial-out-number.component.html',
    styleUrls: ['./dial-out-number.component.scss']
})
export class DialOutNumberComponent implements OnInit {
    form: FormGroup<DialOutForm>;
    message: string;
    isError: boolean;

    constructor(
        private formBuilder: FormBuilder,
        private videocallService: VideoCallService,
        private translateService: TranslateService
    ) {}

    ngOnInit(): void {
        this.form = this.formBuilder.group<DialOutForm>({
            telephone: new FormControl('', [Validators.required, this.phoneNumberValidator, Validators.pattern('[0-9]*')])
        });
    }

    dialOutNumber() {
        if (!this.form.valid) {
            return;
        }

        this.videocallService.callParticipantByTelephone(this.form.value.telephone, (dialoutResponse: PexipDialOutResponse) => {
            this.processDialOutResponse(dialoutResponse);
        });
    }

    processDialOutResponse(dialoutResponse: PexipDialOutResponse) {
        if (dialoutResponse.status === 'success') {
            this.form.reset();
            const message = this.translateService.instant('dial-out-number.dial-out-success-message');
            this.displayMessage(message, false);
        } else {
            const message = this.translateService.instant('dial-out-number.dial-out-failed-message');
            this.displayMessage(message, true);
        }
    }

    private displayMessage(message: string, isError: boolean) {
        this.message = message;
        this.isError = isError;
    }

    private phoneNumberValidator(control: FormControl) {
        if (!control.value) {
            return;
        }
        const phoneNumber = parsePhoneNumberFromString(control.value, 'GB'); // Specify the default country code
        if (phoneNumber?.isValid()) {
            return null;
        }
        return { invalidPhoneNumber: true };
    }
}

interface DialOutForm {
    telephone: FormControl<string>;
}
