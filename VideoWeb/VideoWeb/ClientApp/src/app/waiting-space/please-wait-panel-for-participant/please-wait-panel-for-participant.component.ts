import { Component, Input } from '@angular/core';
import { VHHearing } from 'src/app/shared/models/hearing.vh';

@Component({
    selector: 'app-please-wait-panel-for-participant',
    standalone: false,
    templateUrl: './please-wait-panel-for-participant.component.html',
    styleUrls: ['../waiting-room-global-styles.scss']
})
export class PleaseWaitPanelForParticipantComponent {
    @Input() hearing: VHHearing;
    @Input() isOrHasWitnessLink: boolean;
    @Input() isQuickLinkParticipant: boolean;
    @Input() currentTime: Date;

    getCurrentTimeClass() {
        if (!this.isOrHasWitnessLink && (this.hearing.isOnTime() || this.hearing.isPaused() || this.hearing.isClosed())) {
            return 'hearing-on-time';
        }
        if (!this.isOrHasWitnessLink && (this.hearing.isStarting() || this.hearing.isInSession())) {
            return 'hearing-near-start';
        }
        if (!this.isOrHasWitnessLink && this.hearing.isDelayed()) {
            return 'hearing-delayed';
        }
        if (this.hearing.isSuspended()) {
            return 'hearing-delayed';
        }
        if (this.isOrHasWitnessLink && this.hearing.isInSession()) {
            return 'hearing-near-start';
        } else {
            return 'hearing-on-time';
        }
    }
}
