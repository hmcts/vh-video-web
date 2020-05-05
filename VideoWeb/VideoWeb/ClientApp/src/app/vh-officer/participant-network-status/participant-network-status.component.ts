import { Component, Input, OnInit } from '@angular/core';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { ParticipantStatus } from 'src/app/services/clients/api-client';
import { Logger } from 'src/app/services/logging/logger-base';
import { NetworkHistory } from 'src/app/shared/models/network-history';
import { HeartbeatHealth } from '../../services/models/participant-heartbeat';
import { ParticipantSummary } from '../../shared/models/participant-summary';
import { PackageLost } from '../services/models/package-lost';
import { ParticipantGraphInfo } from '../services/models/participant-graph-info';

@Component({
    selector: 'app-participant-network-status',
    templateUrl: './participant-network-status.component.html',
    styleUrls: ['./participant-network-status.component.scss', '../vho-global-styles.scss']
})
export class ParticipantNetworkStatusComponent implements OnInit {
    @Input() participant: ParticipantSummary;
    @Input() conferenceId: string;

    displayGraph: boolean;
    networkHistory: NetworkHistory;
    monitoringParticipant: ParticipantGraphInfo;

    mousePositionTop: string;
    mousePositionLeft: string;

    constructor(private videoWebService: VideoWebService, private logger: Logger) {}
    ngOnInit(): void {
        this.displayGraph = false;
        if (this.participant.id === 'a66cc906-3e4f-41fc-8946-496825f94823') {
            this.showParticipantGraph();
        }
    }

    async showParticipantGraph() {
        if (this.displayGraph) {
            return;
        }

        let packageLostArray: PackageLost[] = [];
        try {
            const heartbeatHistory = await this.videoWebService.getParticipantHeartbeats(this.conferenceId, this.participant.id);
            packageLostArray = heartbeatHistory.map(x => {
                return new PackageLost(x.recent_packet_loss, x.browser_name, x.browser_version, x.timestamp.getTime());
            });
        } catch (err) {
            this.logger.error(
                `Failed to get heartbeat history for particpant ${this.participant.id} in conference ${this.conferenceId}`,
                err
            );
        }
        this.networkHistory = new NetworkHistory(this.conferenceId, this.participant, packageLostArray);
        this.monitoringParticipant = new ParticipantGraphInfo(
            this.participant.displayName,
            this.participant.status,
            this.participant.representee
        );
        this.setGraphVisibility(true);
        // this.eventbus.emit<NetworkHistory>(new EmitEvent(VHEventType.HeartBeatHistorySelected, payload));
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

    setGraphVisibility(visible: boolean) {
        this.displayGraph = visible;
    }
}
