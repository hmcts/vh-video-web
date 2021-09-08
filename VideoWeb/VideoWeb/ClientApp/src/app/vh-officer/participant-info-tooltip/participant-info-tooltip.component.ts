import { Component, Input } from '@angular/core';
import { Role } from 'src/app/services/clients/api-client';
import { ParticipantContactDetails } from '../../shared/models/participant-contact-details';

@Component({
    selector: 'app-participant-info-tooltip',
    templateUrl: './participant-info-tooltip.component.html',
    styleUrls: ['../vho-global-styles.scss']
})
export class ParticipantInfoTooltipComponent {
    @Input() participant: ParticipantContactDetails;
    joinByQuickLinkText = 'Joined by quick link';
    quickLinkParticipantDisplayText = 'Participant';
    quickLinkObserverDisplayText = 'Observer';

    getHearingRole() {
        let hearingRole = this.participant.hearingRole;
        if (this.participant.role === Role.QuickLinkParticipant) {
            hearingRole = this.quickLinkParticipantDisplayText;
        } else if (this.participant.role === Role.QuickLinkObserver) {
            hearingRole = this.quickLinkObserverDisplayText;
        }
        return hearingRole;
    }
}
