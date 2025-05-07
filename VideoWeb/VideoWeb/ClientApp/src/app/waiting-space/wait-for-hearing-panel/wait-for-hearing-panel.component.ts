import { Component, Input } from '@angular/core';
import { VHHearing } from 'src/app/shared/models/hearing.vh';
import { WaitingRoomUserRole } from '../waiting-room-shared/models/waiting-room-user-role';

@Component({
    selector: 'app-wait-for-hearing-panel',
    standalone: false,
    templateUrl: './wait-for-hearing-panel.component.html',
    styleUrls: ['../waiting-room-global-styles.scss']
})
export class WaitForHearingPanelComponent {
    @Input() hearing: VHHearing;
    @Input() currentTime: Date;
    @Input() userRole: WaitingRoomUserRole;
    @Input() isWitnessOrHasWitnessLink: boolean;
    @Input() isQuickLinkUser: boolean;

    get isJoh() {
        return this.userRole === WaitingRoomUserRole.Joh;
    }

    get isParticipant() {
        return this.userRole === WaitingRoomUserRole.Participant;
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
