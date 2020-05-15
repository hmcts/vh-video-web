import { Component, Input } from '@angular/core';
import { ConferenceStatus } from 'src/app/services/clients/api-client';
import { Hearing } from 'src/app/shared/models/hearing';

@Component({
    selector: 'app-hearing-status',
    templateUrl: './hearing-status.component.html',
    styleUrls: ['./hearing-status.component.scss']
})
export class HearingStatusComponent {
    @Input() hearing: Hearing;
    constructor() {}

    getConferenceStatusText(): string {
        if (this.hearing.getConference().status === ConferenceStatus.NotStarted) {
            if (this.hearing.isDelayed()) {
                return 'Delayed';
            } else {
                return 'Not Started';
            }
        } else if (this.hearing.isSuspended()) {
            return 'Suspended';
        } else if (this.hearing.isPaused()) {
            return 'Paused';
        } else if (this.hearing.isClosed()) {
            return 'Closed';
        } else if (this.hearing.isInSession()) {
            return 'In Session';
        }
    }
}
