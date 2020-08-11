import { Input, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { ParticipantResponse, ParticipantStatus } from 'src/app/services/clients/api-client';
import { EventsService } from 'src/app/services/events.service';
import { HeartbeatHealth, ParticipantHeartbeat } from 'src/app/services/models/participant-heartbeat';

export abstract class ParticipantNetworkHealthBaseComponent implements OnInit, OnDestroy {
    eventSubscriptions$ = new Subscription();
    networkHealth?: HeartbeatHealth;
    @Input() participant: ParticipantResponse;
    constructor(protected eventsService: EventsService) {}

    get isNetworkGood() {
        return this.networkHealth && this.networkHealth === HeartbeatHealth.Good;
    }

    get isVideoOn(): boolean {
        return this.participant.status === ParticipantStatus.InHearing || this.participant.status === ParticipantStatus.InConsultation;
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
}
