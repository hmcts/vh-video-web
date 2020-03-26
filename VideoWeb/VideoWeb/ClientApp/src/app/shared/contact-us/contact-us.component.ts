import { Component } from '@angular/core';
import { VhContactDetails } from '../contact-information';

@Component({
    selector: 'app-contact-us',
    templateUrl: './contact-us.component.html'
})
export class ContactUsComponent {
    contact = {
        phone: VhContactDetails.phone,
        email: VhContactDetails.adminEmail
    };
    constructor() {}
}
