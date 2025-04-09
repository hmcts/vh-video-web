import { Component, Input } from '@angular/core';
import { VHHearing } from 'src/app/shared/models/hearing.vh';

export enum PleaseWaitPanelUserRole {
    Joh = 'Joh',
    Participant = 'Participant',
    QuickLink = 'QuickLink'
}

@Component({
    selector: 'app-please-wait-panel',
    standalone: false,
    templateUrl: './please-wait-panel.component.html',
    styleUrls: ['../waiting-room-global-styles.scss']
})
export class PleaseWaitPanelComponent {
    @Input() hearing: VHHearing;
    @Input() currentTime: Date;
    @Input() userRole: PleaseWaitPanelUserRole;
    @Input() isWitnessOrHasWitnessLink: boolean;

    get isJoh() {
        return this.userRole === PleaseWaitPanelUserRole.Joh;
    }

    get isParticipant() {
        return this.userRole === PleaseWaitPanelUserRole.Participant;
    }

    get isQuickLink() {
        return this.userRole === PleaseWaitPanelUserRole.QuickLink;
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
