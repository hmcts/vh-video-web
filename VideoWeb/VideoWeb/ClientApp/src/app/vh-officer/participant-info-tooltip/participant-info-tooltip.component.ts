import { Component, Input } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Role } from 'src/app/services/clients/api-client';
import { ParticipantContactDetails } from '../../shared/models/participant-contact-details';

@Component({
    selector: 'app-participant-info-tooltip',
    templateUrl: './participant-info-tooltip.component.html',
    styleUrls: ['../vho-global-styles.scss']
})
export class ParticipantInfoTooltipComponent {
    @Input() participant: ParticipantContactDetails;
    constructor(private translateService: TranslateService) {}
    getHearingRole() {
        let hearingRole = this.participant.hearingRole;
        if (this.participant.role === Role.QuickLinkParticipant) {
            hearingRole = this.translateService.instant('participant-info-tooltip.quick-link-participant');
        } else if (this.participant.role === Role.QuickLinkObserver) {
            hearingRole = this.translateService.instant('participant-info-tooltip.quick-link-observer');
        }
        return hearingRole;
    }
}
