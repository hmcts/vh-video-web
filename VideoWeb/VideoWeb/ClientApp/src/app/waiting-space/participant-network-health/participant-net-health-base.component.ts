import { OnInit, OnDestroy, Input } from '@angular/core';
import { Subscription } from 'rxjs';
import { HeartbeatHealth, ParticipantHeartbeat } from 'src/app/services/models/participant-heartbeat';
import { ParticipantResponse, ParticipantStatus } from 'src/app/services/clients/api-client';
import { EventsService } from 'src/app/services/events.service';

export abstract class ParticipantNetworkHealthBaseComponent implements OnInit, OnDestroy {
    eventSubscriptions$ = new Subscription();
    networkHealth?: HeartbeatHealth;
    @Input() participant: ParticipantResponse;
    constructor(protected eventsService: EventsService) {}

    get isNetworkGood() {
        console.log('ParticipantNetworkHealthBaseComponent -> PARTICIPANT ' + this.participant.display_name);
        console.log('ParticipantNetworkHealthBaseComponent -> PARTICIPANT ID ' + this.participant.id);
        console.log('ParticipantNetworkHealthBaseComponent -> NETWORK HEALTH ' + this.networkHealth);
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
        console.log('ParticipantNetworkHealthBaseComponent -> heartbeat ' + heartbeat);
        if (this.participant.id === heartbeat.participantId) {
            this.networkHealth = heartbeat.heartbeatHealth;
        }
    }
}
