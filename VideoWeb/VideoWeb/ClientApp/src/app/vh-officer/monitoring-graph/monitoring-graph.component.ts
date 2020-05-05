import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { ChartDataSets, Chart } from 'chart.js';
import { Color, Label } from 'ng2-charts';
import { MonitorGraphService } from '../services/monitor-graph.service';
import { PackageLost } from '../services/models/package-lost';
import { GraphSettings, graphLabel } from '../services/models/graph-settings';
import { ParticipantGraphInfo } from '../services/models/participant-graph-info';

@Component({
    selector: 'app-monitoring-graph',
    templateUrl: './monitoring-graph.component.html',
    styleUrls: ['./monitoring-graph.component.scss', '../vho-global-styles.scss']
})
export class MonitoringGraphComponent implements OnInit {
    @Input('pakagesLostData')
    set packagesLostData(packagesLost: PackageLost[]) {
        this.transferPackagesLost(packagesLost);
    }

    @Input()
    participantGraphInfo: ParticipantGraphInfo;

    @Output()
    closeGraph: EventEmitter<boolean> = new EventEmitter<boolean>();

    packagesLostValues: number[] = [];
    lineChartData: ChartDataSets[] = [];
    lineChartLabels: Label[] = [];
    lineChartLegend = false;
    lineChartType = 'line';
    lineChartPlugins = [];
    lineChartColors: Color[] = GraphSettings.getlineChartColors();

    lastPoint: number;

    POOR_SIGNAL = 10;
    BAD_SIGNAL = 5;

    lineChartOptions = GraphSettings.getLineChartOptions();
    showUnsupportedBrowser = false;
    participantName: string;

    constructor(private monitorGraphService: MonitorGraphService) {}

    ngOnInit() {
        this.lineChartData.push({ data: Array.from(Array(GraphSettings.MAX_RECORDS), () => this.POOR_SIGNAL), label: graphLabel.Poor });
        this.lineChartData.push({ data: Array.from(Array(GraphSettings.MAX_RECORDS), () => this.BAD_SIGNAL), label: graphLabel.Bad });
        this.lineChartData.push({ data: this.packagesLostValues, label: 'Signal' });

        this.lineChartLabels = Array.from(Array(GraphSettings.MAX_RECORDS), (item, index) => index.toString());
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
        Chart.pluginService.register({
            afterDatasetDraw: (chart, easy) => GraphSettings.setScaleXLabels(chart, easy)
        });
    }

    transferPackagesLost(packagesLost: PackageLost[]) {
        this.showUnsupportedBrowser = this.isUnsupportedBrowser(packagesLost);
        if (!this.showUnsupportedBrowser) {
            this.packagesLostValues = this.monitorGraphService.transferPackagesLost(packagesLost);
            this.lastPoint = this.packagesLostValues[GraphSettings.MAX_RECORDS - 1];
        }
    }

    isUnsupportedBrowser(packages: PackageLost[]): boolean {
        return packages && packages.length > 0 && this.monitorGraphService.isUnsupportedBrowser(packages[packages.length - 1]);
    }

    get lastPackageLostValue() {
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

    close() {
        this.closeGraph.emit(true);
    }
}
