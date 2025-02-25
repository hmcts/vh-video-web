import { Component } from '@angular/core';
import { vhContactDetails } from '../contact-information';

@Component({
    standalone: false,
    selector: 'app-contact-us',
    templateUrl: './contact-us.component.html'
})
export class ContactUsComponent {
    contact = {
        phone: vhContactDetails.englandAndWales.phoneNumber,
        email: vhContactDetails.englandAndWales.email
    };
    constructor() {}
}
