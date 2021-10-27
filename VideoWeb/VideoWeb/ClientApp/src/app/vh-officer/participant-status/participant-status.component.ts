import { Component, Input, OnInit } from '@angular/core';
import { ParticipantStatusDirective } from '../vho-shared/participant-status-base/participant-status-base.component';

@Component({
    selector: 'app-participant-status',
    templateUrl: './participant-status.component.html',
    styleUrls: ['./participant-status.component.scss', '../vho-global-styles.scss']
})
export class ParticipantStatusComponent extends ParticipantStatusDirective implements OnInit {
    @Input() conferenceId: string;

    ngOnInit() {
        this.setupEventHubSubscribers();
        this.loadData();
    }
}
