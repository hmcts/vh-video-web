import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { EventsService } from 'src/app/services/events.service';
import { Subscription } from 'rxjs';
import { ParticipantHeartbeat, HeartbeatHealth } from 'src/app/services/models/participant-heartbeat';
import { ParticipantResponse } from 'src/app/services/clients/api-client';
import { ModalService } from 'src/app/services/modal.service';

@Component({
    selector: 'app-participant-network-health',
    templateUrl: './participant-network-health.component.html',
    styleUrls: ['./participant-network-health.component.scss']
})
export class ParticipantNetworkHealthComponent implements OnInit, OnDestroy {
    static GUIDANCE_MODAL = 'more-info-modal';
    eventSubscriptions$ = new Subscription();
    networkHealth?: HeartbeatHealth;
    @Input() participant: ParticipantResponse;

    constructor(private eventsService: EventsService, private modalService: ModalService) {}

    get isNetworkGood() {
        return this.networkHealth && this.networkHealth === HeartbeatHealth.Good;
    }

    ngOnInit() {
        this.setupSubscribers();
    }

    ngOnDestroy(): void {
        this.eventSubscriptions$.unsubscribe();
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
