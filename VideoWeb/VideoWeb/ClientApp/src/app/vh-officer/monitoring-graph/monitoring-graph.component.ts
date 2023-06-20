import { Component, Input, OnInit } from '@angular/core';
import { Chart, ChartConfiguration, ChartType } from 'chart.js';
import { graphLabel, GraphSettings } from '../services/models/graph-settings';
import { PackageLost } from '../services/models/package-lost';
import { ParticipantGraphInfo } from '../services/models/participant-graph-info';
import { MonitorGraphService } from '../services/monitor-graph.service';

@Component({
    selector: 'app-monitoring-graph',
    templateUrl: './monitoring-graph.component.html',
    styleUrls: ['./monitoring-graph.component.scss', '../vho-global-styles.scss']
})
export class MonitoringGraphComponent implements OnInit {
    @Input()
    participantGraphInfo: ParticipantGraphInfo;

    packagesLostValues: number[] = [];
    public lineChartData: ChartConfiguration<'line'>['data'] = {
        datasets: [],
        labels: []
    };
    lineChartLegend = false;
    lineChartType: ChartType = 'line';
    lastPoint: number;
    lineChartOptions = GraphSettings.getLineChartOptions();
    showUnsupportedBrowser = false;
    participantName: string;

    browserInfoString: string;
    osInfoString: string;
    POOR_SIGNAL = 10;
    BAD_SIGNAL = 5;

    constructor(private monitorGraphService: MonitorGraphService) {}

    get lastPackageLostValue() {
        if (this.showUnsupportedBrowser && !this.lastPoint) {
            return graphLabel.Unsupported;
        }
        if (!this.lastPoint || this.lastPoint === -1) {
            return graphLabel.Disconnected;
        }
        if (this.lastPoint <= this.POOR_SIGNAL && this.lastPoint > this.BAD_SIGNAL) {
            return graphLabel.Poor;
        } else if (this.lastPoint <= this.BAD_SIGNAL && this.lastPoint >= 0) {
            return graphLabel.Bad;
        }
        return graphLabel.Good;
    }

    @Input()
    set pakagesLostData(packagesLost: PackageLost[]) {
        this.transferPackagesLost(packagesLost);
    }

    ngOnInit() {
        this.lineChartData = {
            labels: Array.from(Array(GraphSettings.MAX_RECORDS), (item, index) => index.toString()),
            datasets: [
                {
                    // one for the heartbeat
                    data: this.packagesLostValues,
                    label: 'Signal',
                    fill: true,
                    tension: 0.5,
                    borderColor: 'black',
                    backgroundColor: 'rgba(0,0,0,0)',
                    borderWidth: 2
                },
                {
                    // one for the poor signal
                    data: Array.from(Array(GraphSettings.MAX_RECORDS), () => this.POOR_SIGNAL),
                    label: 'Poor',
                    borderColor: '#ffab00',
                    backgroundColor: 'rgba(0,0,0,0)',
                    borderDash: [5, 5]
                },
                {
                    // one for the poor signal
                    data: Array.from(Array(GraphSettings.MAX_RECORDS), () => this.BAD_SIGNAL),
                    label: 'Bad',
                    borderColor: 'red',
                    backgroundColor: 'rgba(0,0,0,0)',
                    borderDash: [5, 5]
                }
            ]
        };
        // this.lineChartData.push({ data: Array.from(Array(GraphSettings.MAX_RECORDS), () => this.POOR_SIGNAL), label: graphLabel.Poor });
        // this.lineChartData.push({ data: Array.from(Array(GraphSettings.MAX_RECORDS), () => this.BAD_SIGNAL), label: graphLabel.Bad });
        // this.lineChartData.push({ data: this.packagesLostValues, label: 'Signal' });

        // this.lineChartLabels = Array.from(Array(GraphSettings.MAX_RECORDS), (item, index) => index.toString());
        this.packagesLostValues = Array(GraphSettings.MAX_RECORDS).fill(NaN);
        this.registerPlugin();
        this.setParticipantName();
    }

    setParticipantName() {
        if (this.participantGraphInfo) {
            this.participantName =
                this.participantGraphInfo.representee && this.participantGraphInfo.representee.length > 0
                    ? `${this.participantGraphInfo.name}, representing ${this.participantGraphInfo.representee}`
                    : this.participantGraphInfo.name;
        }
    }

    registerPlugin() {
        Chart.register({
            id: 'hello',
            afterDatasetDraw: (chart, args, options) => GraphSettings.setScaleXLabels(chart, args, options)
        });
    }

    transferPackagesLost(packagesLost: PackageLost[]) {
        this.showUnsupportedBrowser = this.isUnsupportedBrowser(packagesLost);
        this.browserInfoString = this.getBrowserInfoString(packagesLost);
        this.osInfoString = this.getOsInfoString(packagesLost);
        if (!this.showUnsupportedBrowser) {
            this.packagesLostValues = this.monitorGraphService.transferPackagesLost(packagesLost);
            this.lastPoint = this.packagesLostValues[GraphSettings.MAX_RECORDS - 1];
        }
    }

    isUnsupportedBrowser(packages: PackageLost[]): boolean {
        return packages && packages.length > 0 && this.monitorGraphService.isUnsupportedBrowser(packages[packages.length - 1]);
    }

    getBrowserInfoString(packages: PackageLost[]) {
        return packages && packages.length > 0
            ? `${packages[packages.length - 1].browserName} ${packages[packages.length - 1].browserVersion}`
            : 'No browser info.';
    }

    getOsInfoString(packages: PackageLost[]) {
        return packages && packages.length > 0
            ? `${packages[packages.length - 1].osName} ${packages[packages.length - 1].osVersion}`
            : 'No OS info.';
    }
}
