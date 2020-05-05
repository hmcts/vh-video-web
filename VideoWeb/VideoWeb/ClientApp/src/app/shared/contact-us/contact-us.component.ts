import { Component } from '@angular/core';
import { vhContactDetails } from '../contact-information';

@Component({
    selector: 'app-contact-us',
    templateUrl: './contact-us.component.html'
})
export class ContactUsComponent {
    contact = {
        phone: vhContactDetails.phone,
        email: vhContactDetails.adminEmail
    };
    constructor() {}
}
