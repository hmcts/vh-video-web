import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { parsePhoneNumberFromString } from 'libphonenumber-js';
import { VideoCallService } from 'src/app/waiting-space/services/video-call.service';

@Component({
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
        private videocallService: VideoCallService
    ) {}

    ngOnInit(): void {
        this.form = this.formBuilder.group<DialOutForm>({
            telephone: new FormControl('', [Validators.required, this.phoneNumberValidator])
        });
    }

    dialOutNumber() {
        if (!this.form.valid) {
            return;
        }

        console.log('Dialling out to ' + this.form.value.telephone);
        const telephone = parsePhoneNumberFromString(this.form.value.telephone, 'GB');
        this.videocallService.callParticipantByTelephone(telephone.number, (dialoutResponse: PexipDialOutResponse) => {
            this.processDialOutResponse(dialoutResponse);
        });
    }

    processDialOutResponse(dialoutResponse: PexipDialOutResponse) {
        if (dialoutResponse.status === 'success') {
            this.form.reset();
            this.displayMessage('Dial out successful', false);
        } else {
            this.displayMessage('Dial out failed', true);
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
