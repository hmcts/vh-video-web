import { Component } from '@angular/core';
import { Subscription } from 'rxjs';
import { EventsService } from 'src/app/services/events.service';
import { ModalService } from 'src/app/services/modal.service';
import { HeartbeatHealth, ParticipantHeartbeat } from 'src/app/services/models/participant-heartbeat';
import { ParticipantNetworkHealthBaseComponent } from './participant-net-health-base.component';

@Component({
    selector: 'app-participant-network-health',
    templateUrl: './participant-network-health.component.html',
    styleUrls: ['./participant-network-health.component.scss']
})
export class ParticipantNetworkHealthComponent extends ParticipantNetworkHealthBaseComponent {
    static GUIDANCE_MODAL = 'more-info-modal';
    eventSubscriptions$ = new Subscription();
    networkHealth?: HeartbeatHealth;

    constructor(protected eventsService: EventsService, private modalService: ModalService) {
        super(eventsService);
    }

    get isNetworkGood() {
        return this.networkHealth && this.networkHealth === HeartbeatHealth.Good;
    }

    setupSubscribers() {
        this.eventSubscriptions$.add(this.eventsService.getHeartbeat().subscribe(heartbeat => this.handleHeartbeat(heartbeat)));
    }

    handleHeartbeat(heartbeat: ParticipantHeartbeat): void {
        if (this.participant.id === heartbeat.participantId) {
            this.networkHealth = heartbeat.heartbeatHealth;
        }
    }

    displayGuidanceModal() {
        this.modalService.open(ParticipantNetworkHealthComponent.GUIDANCE_MODAL);
    }

    closeGuidanceModal() {
        this.modalService.close(ParticipantNetworkHealthComponent.GUIDANCE_MODAL);
    }
}
