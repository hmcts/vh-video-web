import { Component } from '@angular/core';
import { EventsService } from 'src/app/services/events.service';
import { ParticipantNetworkHealthBaseComponent } from './participant-net-health-base.component';

@Component({
    selector: 'app-waiting-room-monitor',
    templateUrl: './waiting-room-monitor.component.html',
    styleUrls: ['./participant-network-health.component.scss']
})
export class WaitingRoomMonitorComponent extends ParticipantNetworkHealthBaseComponent {
    constructor(protected eventsService: EventsService) {
        super(eventsService);
    }
}
