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
        const displayName = telephone.formatNational().slice(-4);
        this.videocallService.callParticipantByTelephone(telephone.number, displayName, dialoutResponse => {
            console.log('Dial out response', dialoutResponse);
        });
    }

    phoneNumberValidator(control: FormControl) {
        const phoneNumber = parsePhoneNumberFromString(control.value, 'GB'); // Specify the default country code
        if (phoneNumber && phoneNumber.isValid()) {
            return null;
        }
        return { invalidPhoneNumber: true };
    }
}

interface DialOutForm {
    telephone: FormControl<string>;
}
