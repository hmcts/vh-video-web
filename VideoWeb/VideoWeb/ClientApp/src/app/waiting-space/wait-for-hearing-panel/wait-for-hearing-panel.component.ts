import { Component, Input } from '@angular/core';
import { VHHearing } from 'src/app/shared/models/hearing.vh';

export enum WaitForHearingPanelUserRole {
    Joh = 'Joh',
    Participant = 'Participant',
    QuickLink = 'QuickLink'
}

@Component({
    selector: 'app-wait-for-hearing-panel',
    standalone: false,
    templateUrl: './wait-for-hearing-panel.component.html',
    styleUrls: ['../waiting-room-global-styles.scss']
})
export class WaitForHearingPanelComponent {
    @Input() hearing: VHHearing;
    @Input() currentTime: Date;
    @Input() userRole: WaitForHearingPanelUserRole;
    @Input() isWitnessOrHasWitnessLink: boolean;

    get isJoh() {
        return this.userRole === WaitForHearingPanelUserRole.Joh;
    }

    get isParticipant() {
        return this.userRole === WaitForHearingPanelUserRole.Participant;
    }

    get isQuickLink() {
        return this.userRole === WaitForHearingPanelUserRole.QuickLink;
    }

    getCurrentTimeClass() {
        if (this.isJoh) {
            return this.getCurrentTimeClassForJoh();
        }

        if (!this.isWitnessOrHasWitnessLink && (this.hearing.isOnTime() || this.hearing.isPaused() || this.hearing.isClosed())) {
            return 'hearing-on-time';
        }
        if (!this.isWitnessOrHasWitnessLink && (this.hearing.isStarting() || this.hearing.isInSession())) {
            return 'hearing-near-start';
        }
        if (!this.isWitnessOrHasWitnessLink && this.hearing.isDelayed()) {
            return 'hearing-delayed';
        }
        if (this.hearing.isSuspended()) {
            return 'hearing-delayed';
        }
        if (this.isWitnessOrHasWitnessLink && this.hearing.isInSession()) {
            return 'hearing-near-start';
        } else {
            return 'hearing-on-time';
        }
    }

    getCurrentTimeClassForJoh() {
        if (this.hearing.isSuspended()) {
            return 'hearing-delayed';
        }
        return 'hearing-on-time';
    }
}
