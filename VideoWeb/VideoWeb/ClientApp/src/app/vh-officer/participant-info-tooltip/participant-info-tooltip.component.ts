import { Component, Input } from '@angular/core';
import { ParticipantContactDetails } from '../../shared/models/participant-contact-details';

@Component({
    selector: 'app-participant-info-tooltip',
    templateUrl: './participant-info-tooltip.component.html',
    styleUrls: ['../vho-global-styles.scss']
})
export class ParticipantInfoTooltipComponent {
    @Input() participant: ParticipantContactDetails;
    constructor() {}
}
