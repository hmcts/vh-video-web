import { Input, OnDestroy, OnInit, Directive } from '@angular/core';
import { Subscription } from 'rxjs';
import { ParticipantResponse, ParticipantStatus } from 'src/app/services/clients/api-client';
import { EventsService } from 'src/app/services/events.service';
import { HeartbeatHealth, ParticipantHeartbeat } from 'src/app/services/models/participant-heartbeat';

@Directive()
export abstract class ParticipantNetworkHealthBaseDirective implements OnInit, OnDestroy {
    @Input() participant: ParticipantResponse;
    @Input() showDetail = true;

    eventSubscriptions$ = new Subscription();
    networkHealth?: HeartbeatHealth;

    constructor(protected eventsService: EventsService) {}

    get isNetworkPoor() {
        return this.networkHealth && (this.networkHealth === HeartbeatHealth.Poor || this.networkHealth === HeartbeatHealth.Bad);
    }

    get isVideoOn(): boolean {
        return this.participant.status === ParticipantStatus.InHearing || this.participant.status === ParticipantStatus.InConsultation;
    }

    get isInConsultation(): boolean {
        return this.participant.status === ParticipantStatus.InConsultation;
    }

    get isInHearing(): boolean {
        return this.participant.status === ParticipantStatus.InHearing;
    }

    get isDisconnected(): boolean {
        return this.participant.status === ParticipantStatus.Disconnected;
    }

    ngOnInit() {
        this.eventSubscriptions$.add(this.eventsService.getHeartbeat().subscribe(heartbeat => this.handleHeartbeat(heartbeat)));
    }

    ngOnDestroy(): void {
        this.eventSubscriptions$.unsubscribe();
    }

    handleHeartbeat(heartbeat: ParticipantHeartbeat): void {
        if (this.participant.id === heartbeat.participantId) {
            this.networkHealth = heartbeat.heartbeatHealth;
        }
    }
}
