import { Component } from '@angular/core';
import { vhContactDetails } from 'src/app/shared/contact-information';

@Component({
    selector: 'app-contact-us-folding',
    templateUrl: './contact-us-folding.component.html'
})
export class ContactUsFoldingComponent {
    expanded: boolean;

    contact = {
        phone: vhContactDetails.phone,
        email: vhContactDetails.adminEmail
    };

    constructor() {}

    toggle() {
        this.expanded = !this.expanded;
    }
}
