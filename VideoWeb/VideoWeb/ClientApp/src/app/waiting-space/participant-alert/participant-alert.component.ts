import { Component } from '@angular/core';
import { Subscription } from 'rxjs';
import { EventsService } from 'src/app/services/events.service';
import { HeartbeatHealth, ParticipantHeartbeat } from 'src/app/services/models/participant-heartbeat';
import { ParticipantNetworkHealthBaseComponent } from '../participant-network-health/participant-net-health-base.component';

@Component({
    selector: 'app-participant-alert',
    templateUrl: './participant-alert.component.html',
    styleUrls: ['../participants-panel/participants-panel.component.scss', './participant-alert.component.scss']
})
export class ParticipantAlertComponent extends ParticipantNetworkHealthBaseComponent {
    eventSubscriptions$ = new Subscription();
    networkHealth?: HeartbeatHealth;
    constructor(protected eventsService: EventsService) {
        super(eventsService);
    }

    setupSubscribers() {
        this.eventSubscriptions$.add(this.eventsService.getHeartbeat().subscribe(heartbeat => this.handleHeartbeat(heartbeat)));
    }

    handleHeartbeat(heartbeat: ParticipantHeartbeat): void {
        if (this.participant.id === heartbeat.participantId) {
            this.networkHealth = heartbeat.heartbeatHealth;
        }
    }
}
