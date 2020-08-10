import { Component } from '@angular/core';
import { EventsService } from 'src/app/services/events.service';
import { ParticipantNetworkHealthBaseComponent } from '../participant-network-health/participant-net-health-base.component';

@Component({
    selector: 'app-participant-alert',
    templateUrl: './participant-alert.component.html',
    styleUrls: ['../participants-panel/participants-panel.component.scss', './participant-alert.component.scss']
})
export class ParticipantAlertComponent extends ParticipantNetworkHealthBaseComponent {
    constructor(protected eventsService: EventsService) {
        super(eventsService);
    }
}
