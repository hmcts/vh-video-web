import { Component } from '@angular/core';
import { vhContactDetails } from 'src/app/shared/contact-information';

@Component({
    selector: 'app-contact-us-folding',
    templateUrl: './contact-us-folding.component.html',
    styleUrls: ['./contact-us-folding.component.scss']
})
export class ContactUsFoldingComponent {
    expanded: boolean;

    contact = {
        phone: vhContactDetails.englandAndWales.phoneNumber,
        email: vhContactDetails.englandAndWales.email
    };

    constructor() {}

    toggle() {
        this.expanded = !this.expanded;
    }
}
