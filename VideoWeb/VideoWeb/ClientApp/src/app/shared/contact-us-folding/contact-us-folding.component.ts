import { Component } from '@angular/core';
import { vhContactDetails } from 'src/app/shared/contact-information';

@Component({
    standalone: false,
    selector: 'app-contact-us-folding',
    templateUrl: './contact-us-folding.component.html',
    styleUrls: ['./contact-us-folding.component.scss']
})
export class ContactUsFoldingComponent {
    expanded: boolean;
    contactDetails = vhContactDetails;

    constructor() {}

    toggle() {
        this.expanded = !this.expanded;
    }
}
