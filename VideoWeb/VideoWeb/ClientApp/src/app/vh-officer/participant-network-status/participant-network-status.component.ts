import { Component, ElementRef, Input, OnInit, ViewChild, AfterContentChecked } from '@angular/core';
import { ParticipantStatus } from 'src/app/services/clients/api-client';
import { Logger } from 'src/app/services/logging/logger-base';
import { HeartbeatHealth } from '../../services/models/participant-heartbeat';
import { ParticipantSummary } from '../../shared/models/participant-summary';
import { PackageLost } from '../services/models/package-lost';
import { ParticipantGraphInfo } from '../services/models/participant-graph-info';
import { VhoQueryService } from '../services/vho-query-service.service';

@Component({
    selector: 'app-participant-network-status',
    templateUrl: './participant-network-status.component.html',
    styleUrls: ['./participant-network-status.component.scss', '../vho-global-styles.scss']
})
export class ParticipantNetworkStatusComponent implements OnInit, AfterContentChecked {
    @Input() participant: ParticipantSummary;
    @Input() conferenceId: string;

    displayGraph: boolean;
    loading: boolean;
    monitoringParticipant: ParticipantGraphInfo;
    packageLostArray: PackageLost[];

    timeout: NodeJS.Timer;
    mouseEvent: MouseEvent;

    @ViewChild('graphContainer', { static: false })
    graphContainer: ElementRef;

    constructor(private vhoQuery: VhoQueryService, private logger: Logger) {}
    ngOnInit(): void {
        this.displayGraph = false;
        this.packageLostArray = [];
    }

    onMouseEnter($event: MouseEvent) {
        const self = this;
        this.mouseEvent = $event;
        this.timeout = setTimeout(async function () {
            await self.showParticipantGraph($event);
        }, 500);
    }

    onMouseExit($event: MouseEvent) {
        clearTimeout(this.timeout);
        this.setGraphVisibility(false);
    }

    async showParticipantGraph($event: MouseEvent) {
        this.mouseEvent = $event;
        if (this.displayGraph || this.loading) {
            this.logger.debug('Graph already displayed or still loading');
            return;
        }
        try {
            this.loading = true;
            const heartbeatHistory = await this.vhoQuery.getParticipantHeartbeats(this.conferenceId, this.participant.id);

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
            this.updateGraphPosition($event);
        } catch (err) {
            this.loading = false;
            this.logger.error(
                `Failed to get heartbeat history for particpant ${this.participant.id} in conference ${this.conferenceId}`,
                err
            );
        }
    }

    updateGraphPosition($event: MouseEvent) {
        this.mouseEvent = $event;
        if (!this.graphContainer) {
            return;
        }
        const x = $event.clientX;
        const y = $event.clientY;
        const elem = this.graphContainer.nativeElement as HTMLDivElement;

        elem.style.top = y + 10 + 'px';
        elem.style.left = x - 5 + 'px';
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

    ngAfterContentChecked(): void {
        this.updateGraphPosition(this.mouseEvent);
    }
}
