import { Input, OnDestroy, OnInit, Directive } from '@angular/core';
import { Subject } from 'rxjs';
import { ParticipantStatus } from 'src/app/services/clients/api-client';
import { EventsService } from 'src/app/services/events.service';
import { HeartbeatHealth, ParticipantHeartbeat } from 'src/app/services/models/participant-heartbeat';
import { VHParticipant } from '../store/models/vh-conference';
import { takeUntil } from 'rxjs/operators';

@Directive()
export abstract class ParticipantNetworkHealthBaseDirective implements OnInit, OnDestroy {
    @Input() participant: VHParticipant;
    @Input() showDetail = true;

    networkHealth?: HeartbeatHealth;

    protected destroyed$ = new Subject();

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
        this.eventsService
            .getHeartbeat()
            .pipe(takeUntil(this.destroyed$))
            .subscribe(heartbeat => this.handleHeartbeat(heartbeat));
    }

    ngOnDestroy(): void {
        this.destroyed$.next();
        this.destroyed$.complete();
    }

    handleHeartbeat(heartbeat: ParticipantHeartbeat): void {
        if (this.participant.id === heartbeat.participantId) {
            this.networkHealth = heartbeat.heartbeatHealth;
        }
    }
}
