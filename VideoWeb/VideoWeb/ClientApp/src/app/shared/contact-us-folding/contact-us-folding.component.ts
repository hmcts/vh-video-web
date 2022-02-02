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
        englandAndWalesPhone: vhContactDetails.englandAndWales.phoneNumber,
        englandAndWalesEmail: vhContactDetails.englandAndWales.email,
        scotlandPhone: vhContactDetails.scotland.phoneNumber,
        scotlandEmail: vhContactDetails.scotland.email
    };

    constructor() {}

    toggle() {
        this.expanded = !this.expanded;
    }
}
