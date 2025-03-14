import { MonitoringGraphComponent } from '../monitoring-graph/monitoring-graph.component';
import { MonitorGraphService } from '../services/monitor-graph.service';
import { PackageLost } from '../services/models/package-lost';
import { ParticipantGraphInfo } from '../services/models/participant-graph-info';

class GraphTestData {
    static getData() {
        const valuesPackageLost: PackageLost[] = [];
        let timePackage = new Date(Date.now()).getTime();
        for (let i = 0; i < 90; i++) {
            valuesPackageLost.push(new PackageLost(1, 'Edge', '44.001', 'Mac', '10.15', timePackage - 5000));
            valuesPackageLost.push(new PackageLost(10, 'Chrome', '77.02', 'Mac', '10.15', timePackage - 10000));
            timePackage = timePackage - 15000;
        }

        return valuesPackageLost;
    }
}

describe('MonitoringGraphComponent', () => {
    let valuesPackageLost: PackageLost[] = [];
    const component = new MonitoringGraphComponent(new MonitorGraphService());

    it('should convert package lost values to signal strangth', () => {
        valuesPackageLost = [];
        const timePackage = new Date(Date.now()).getTime();
        valuesPackageLost.push(new PackageLost(1, 'Edge', '44.001', 'Mac', '10.15', timePackage - 5000));
        valuesPackageLost.push(new PackageLost(10, 'Chrome', '', 'Mac', '10.15', timePackage - 10000));
        component.transferPackagesLost(valuesPackageLost);
        const newValues = component.packagesLostValues.filter(x => !isNaN(x));
        expect(newValues.length).toBe(2);
        expect(newValues[0]).toBe(10);
        expect(newValues[1]).toBe(19);
    });
    it('should get the last package lost value', () => {
        valuesPackageLost = GraphTestData.getData();
        component.transferPackagesLost(valuesPackageLost);
        const lastValue = component.lastPoint;
        expect(lastValue).toBe(19);
    });
    it('should get the browser info string', () => {
        valuesPackageLost = GraphTestData.getData();
        component.transferPackagesLost(valuesPackageLost);
        expect(component.browserInfoString).toBe('Chrome 77.02');
    });
    it('should get the os info string', () => {
        valuesPackageLost = GraphTestData.getData();
        component.transferPackagesLost(valuesPackageLost);
        expect(component.osInfoString).toBe('Mac 10.15');
    });
    it('should defined the signal strength by the last package lost value as bad ', () => {
        component.lastPoint = 1;
        const lastValue = component.lastPackageLostValue;
        expect(lastValue).toBe('bad');
    });
    it('should defined the signal strength by the last package lost value as poor', () => {
        component.lastPoint = 10;
        const lastValue = component.lastPackageLostValue;
        expect(lastValue).toBe('poor');
    });
    it('should defined the signal strength by the last package lost value as good', () => {
        component.lastPoint = 20;
        const lastValue = component.lastPackageLostValue;
        expect(lastValue).toBe('good');
    });
    it('should defined the signal strength by the last package lost value as disconnected', () => {
        component.lastPoint = NaN;
        const lastValue = component.lastPackageLostValue;
        expect(lastValue).toBe('disconnected');
    });
    it('should defined the signal strength by the last package lost value as unsupported', () => {
        component.showUnsupportedBrowser = true;
        const lastValue = component.lastPackageLostValue;
        expect(lastValue).toBe('unsupported');
        expect(component.browserInfoString).toBe('Chrome 77.02');
    });
    it('should defined the signal strength as disconnected if no data recieved', () => {
        const valuesPackageLoss = [];
        component.transferPackagesLost(valuesPackageLoss);
        const lastValue = component.lastPackageLostValue;
        expect(lastValue).toBe('disconnected');
    });
    it('should defined the participant name with representee', () => {
        component.participantGraphInfo = new ParticipantGraphInfo('David', 'Disconnected', 'Mr X');
        component.ngOnInit();
        expect(component.participantName).toBe('David, representing Mr X');
        expect(component.lineChartData.datasets.length).toBe(3); // one for data, one for poor signal, one for bad signal
    });
    it('should defined the participant name with no representee', () => {
        component.participantGraphInfo = new ParticipantGraphInfo('David', 'Disconnected', null);
        component.ngOnInit();
        expect(component.participantName).toBe('David');
        expect(component.lineChartData.datasets.length).toBe(3); // one for data, one for poor signal, one for bad signal
    });
});
