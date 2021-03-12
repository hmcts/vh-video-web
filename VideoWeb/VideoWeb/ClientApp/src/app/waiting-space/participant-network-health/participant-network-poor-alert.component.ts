import { Input, Component } from '@angular/core';
import { ParticipantResponse } from 'src/app/services/clients/api-client';
import { EventsService } from 'src/app/services/events.service';
import { ParticipantHeartbeat } from '../../services/models/participant-heartbeat';
import { NotificationToastrService } from '../services/notification-toastr.service';
import { ParticipantNetworkHealthBaseDirective } from './participant-net-health-base.component';

@Component({
    selector: 'app-participant-network-alert',
    template: ''
})
export class ParticipantNetworkPoorAlertComponent extends ParticipantNetworkHealthBaseDirective {
    @Input() participant: ParticipantResponse;

    constructor(protected eventsService: EventsService, private notificationToastrService: NotificationToastrService) {
        super(eventsService);
    }

    setupSubscribers() {
        this.eventSubscriptions$.add(this.eventsService.getHeartbeat().subscribe(heartbeat => this.handleHeartbeat(heartbeat)));
    }

    handleHeartbeat(heartbeat: ParticipantHeartbeat): void {
        if (this.participant.id === heartbeat.participantId) {
            this.networkHealth = heartbeat.heartbeatHealth;
            if (this.isNetworkPoor && (this.isInConsultation || this.isInHearing)) {
                this.notificationToastrService.reportPoorConnection(heartbeat);
            }
        }
    }
}
