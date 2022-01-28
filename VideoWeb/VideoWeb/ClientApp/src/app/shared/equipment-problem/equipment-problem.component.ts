import { Component, OnInit } from '@angular/core';
import { vhContactDetails } from '../contact-information';

@Component({
    selector: 'app-equipment-problem',
    templateUrl: './equipment-problem.component.html',
    styleUrls: []
})
export class EquipmentProblemComponent implements OnInit {
    contactDetails = vhContactDetails;

    ngOnInit() {}
}
