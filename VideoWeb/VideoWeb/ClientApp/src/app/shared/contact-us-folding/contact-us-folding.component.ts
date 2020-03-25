import { Component } from '@angular/core';
import { VhContactDetails } from 'src/app/shared/contact-information';

@Component({
    selector: 'app-contact-us-folding',
    templateUrl: './contact-us-folding.component.html'
})
export class ContactUsFoldingComponent {
    expanded: boolean;

    contact = {
        phone: VhContactDetails.phone,
        email: VhContactDetails.adminEmail
    };

    constructor() {}

    toggle() {
        this.expanded = !this.expanded;
    }
}
