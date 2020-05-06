import { Component, Input, OnInit } from '@angular/core';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { ParticipantStatus } from 'src/app/services/clients/api-client';
import { Logger } from 'src/app/services/logging/logger-base';
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
    loading: boolean;
    monitoringParticipant: ParticipantGraphInfo;
    packageLostArray: PackageLost[];

    constructor(private videoWebService: VideoWebService, private logger: Logger) {}
    ngOnInit(): void {
        this.displayGraph = false;
        this.packageLostArray = [];
    }

    async showParticipantGraph() {
        this.logger.debug('showParticipantGraph');
        if (this.displayGraph || this.loading) {
            return;
        }
        try {
            this.loading = true;
            const heartbeatHistory = await this.videoWebService.getParticipantHeartbeats(this.conferenceId, this.participant.id);

            this.loading = false;
            this.packageLostArray = heartbeatHistory.map(x => {
                return new PackageLost(x.recent_packet_loss, x.browser_name, x.browser_version, x.timestamp.getTime());
            });

            this.monitoringParticipant = new ParticipantGraphInfo(
                this.participant.displayName,
                this.participant.status,
                this.participant.representee
            );
            this.setGraphVisibility(true);
        } catch (err) {
            this.loading = false;
            this.logger.error(
                `Failed to get heartbeat history for particpant ${this.participant.id} in conference ${this.conferenceId}`,
                err
            );
        }
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
            if (this.isUnsupportedBrowser(this.participant.participantHertBeatHealth.browserName)) {
                return 'incompatible-browser-signal.png';
            } else {
                if (this.participant.status === ParticipantStatus.Disconnected) {
                    return 'disconnected.png';
                } else {
                    return this.getIconForParticipantNetworkStatus();
                }
            }
        }
    }

    getIconForParticipantNetworkStatus() {
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

    isUnsupportedBrowser(browserName: string) {
        return browserName.toLowerCase() === 'ms-edge' || browserName.toLowerCase() === 'safari';
    }

    setGraphVisibility(visible: boolean) {
        this.displayGraph = visible;
    }
}
