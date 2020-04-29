import { Component, OnInit, Input } from '@angular/core';
import {ParticipantContactDetails} from '../../shared/models/participant-contact-details';

@Component({
    selector: 'app-participant-info-tooltip',
    templateUrl: './participant-info-tooltip.component.html'
})
export class ParticipantInfoTooltipComponent implements OnInit {
    @Input() participant: ParticipantContactDetails;
    constructor() {}

    ngOnInit() {}
}
