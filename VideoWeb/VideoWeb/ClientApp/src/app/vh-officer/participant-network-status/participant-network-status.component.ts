import { Component, Input, Output, EventEmitter } from '@angular/core';
import { ParticipantStatus } from 'src/app/services/clients/api-client';
import { ParticipantSummary } from '../../shared/models/participant-summary';
import { HeartbeatHealth } from '../../services/models/participant-heartbeat';

@Component({
    selector: 'app-participant-network-status',
    templateUrl: './participant-network-status.component.html',
    styleUrls: ['./participant-network-status.component.scss', '../vho-global-styles.scss']
})
export class ParticipantNetworkStatusComponent {
    @Input() participant: ParticipantSummary;

    @Output()
    showMonitorGraph: EventEmitter<ParticipantSummary> = new EventEmitter<ParticipantSummary>();

    constructor() {}

    showParticipantGraph() {
        this.showMonitorGraph.emit(this.participant);
    }

    getParticipantNetworkStatus(): string {
        if (this.participant === undefined) {
            return 'not-signed-in.png';
        } else if (this.participant.participantHertBeatHealth === undefined) {
            if (this.participant.status === ParticipantStatus.Disconnected) {
                return 'disconnected.png';
            } else {
                return 'not-signed-in.png';
            }
        } else {
            if (
                this.participant.participantHertBeatHealth.browserName.toLowerCase() === 'ms-edge' ||
                this.participant.participantHertBeatHealth.browserName.toLowerCase() === 'safari'
            ) {
                return 'incompatible-browser-signal.png';
            } else {
                if (this.participant.status === ParticipantStatus.Disconnected) {
                    return 'disconnected.png';
                } else {
                    switch (this.participant.participantHertBeatHealth.heartbeatHealth) {
                        case HeartbeatHealth.Good:
                            return 'good-signal.png';
                        case HeartbeatHealth.Bad:
                            return 'bad-signal.png';
                        case HeartbeatHealth.Poor:
                            return 'poor-signal.png';
                        case HeartbeatHealth.None:
                            return 'incompatible-browser-signal.png';
                    }
                }
            }
        }
    }
}
