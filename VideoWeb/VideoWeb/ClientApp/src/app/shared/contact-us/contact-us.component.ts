import { Component } from '@angular/core';
import { vhContactDetails } from '../contact-information';

@Component({
    selector: 'app-contact-us',
    templateUrl: './contact-us.component.html'
})
export class ContactUsComponent {
    contact = {
        phone: vhContactDetails.uk.phoneNumber,
        email: vhContactDetails.uk.email
    };
    constructor() {}
}
