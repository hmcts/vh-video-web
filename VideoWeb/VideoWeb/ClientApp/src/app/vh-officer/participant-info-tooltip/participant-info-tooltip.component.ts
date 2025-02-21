import { Component, Input } from '@angular/core';
import { Role } from 'src/app/services/clients/api-client';
import { ParticipantContactDetails } from '../../shared/models/participant-contact-details';
import { TranslateService } from '@ngx-translate/core';

@Component({
    standalone: false,
    selector: 'app-participant-info-tooltip',
    templateUrl: './participant-info-tooltip.component.html',
    styleUrls: ['../vho-global-styles.scss']
})
export class ParticipantInfoTooltipComponent {
    @Input() participant: ParticipantContactDetails;

    quickLinkParticipantDisplayText = 'Participant';
    quickLinkObserverDisplayText = 'Observer';

    constructor(private translateService: TranslateService) {}

    getHearingRole() {
        let hearingRole = this.participant.hearingRole;
        if (this.participant.role === Role.QuickLinkParticipant) {
            hearingRole = this.quickLinkParticipantDisplayText;
        } else if (this.participant.role === Role.QuickLinkObserver) {
            hearingRole = this.quickLinkObserverDisplayText;
        }
        return hearingRole;
    }

    getJoinByLinkText() {
        return this.translateService.instant('participant-info-tooltip.join-by-link-text');
    }
}
