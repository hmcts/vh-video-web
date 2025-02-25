import { Component } from '@angular/core';
import { Subscription } from 'rxjs';
import { EventsService } from 'src/app/services/events.service';
import { ModalService } from 'src/app/services/modal.service';
import { HeartbeatHealth } from 'src/app/services/models/participant-heartbeat';
import { ParticipantNetworkHealthBaseDirective } from './participant-net-health-base.component';

@Component({
    standalone: false,
    selector: 'app-participant-network-health',
    templateUrl: './participant-network-health.component.html',
    styleUrls: ['./participant-network-health.component.scss']
})
export class ParticipantNetworkHealthComponent extends ParticipantNetworkHealthBaseDirective {
    static readonly GUIDANCE_MODAL = 'more-info-modal';
    eventSubscriptions$ = new Subscription();
    networkHealth?: HeartbeatHealth;

    constructor(
        protected eventsService: EventsService,
        private modalService: ModalService
    ) {
        super(eventsService);
    }

    displayGuidanceModal() {
        this.modalService.open(ParticipantNetworkHealthComponent.GUIDANCE_MODAL);
    }

    closeGuidanceModal() {
        this.modalService.close(ParticipantNetworkHealthComponent.GUIDANCE_MODAL);
    }
}
