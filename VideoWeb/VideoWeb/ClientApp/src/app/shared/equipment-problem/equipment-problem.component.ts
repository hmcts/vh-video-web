import { Component } from '@angular/core';
import { vhContactDetails } from 'src/app/shared/contact-information';

@Component({
    selector: 'app-equipment-problem',
    templateUrl: './equipment-problem.component.html',
    styleUrls: []
})
export class EquipmentProblemComponent {
    contactDetails = vhContactDetails;
}
