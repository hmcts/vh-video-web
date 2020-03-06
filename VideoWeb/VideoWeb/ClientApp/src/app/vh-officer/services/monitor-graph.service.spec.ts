import { MonitorGraphService } from '../services/monitor-graph.service';
import { PackageLost } from './models/package-lost';
import { UnsupportedBrowserHeartbeat } from './models/unsupported-browser-heartbeat';
import { GraphSettings } from './models/graph-settings';

describe('MonitorGraphService', () => {
  const service = new MonitorGraphService();

  it('should set list of unsupported browsers and versions', () => {
    expect(service.unsupportedBroswer.length).toBeGreaterThan(0);
    expect(service.unsupportedBroswer[0].name).toBe('Safari');
  });
  it('should return true if the user browser is unsupported', () => {
    const result = service.isUnsupportedBrowser(new PackageLost(10, 'Safari', null, 1583487492315));
    expect(result).toBeTruthy();
  });
  it('should return false if the user browser version greater than unsupported version', () => {

    const result = service.isUnsupportedBrowser(new PackageLost(10, 'Chrome', '80.0.3988.0', 1583487492315));
    service.unsupportedBroswer.push(new UnsupportedBrowserHeartbeat('Chrome', '80.0.3987.122'))
    expect(result).toBe(false);
  });
  it('should return true if the user browser version equal to unsupported version', () => {

    const result = service.isUnsupportedBrowser(new PackageLost(10, 'Edge', '44.19041', 1583487492315));
    expect(result).toBe(true);
  });
  it('should return false if the user browser version is supported version', () => {

    const result = service.isUnsupportedBrowser(new PackageLost(10, 'Edge', '79.0.309', 1583487492315));
    expect(result).toBe(false);
  });
  it('should reverse package lost value', () => {
    const data = GraphTestData.getData();
    debugger;
    const result = service.transferPackagesLost(data);
    expect(result.length).toBe(GraphSettings.MAX_RECORDS);
    expect(result[result.length - 1]).toBe(19);
  });
});

class GraphTestData {
  static getData() {
    let valuesPackageLost: PackageLost[] = [];
    let timePackage = new Date(Date.now()).getTime();
    for (var i = 0; i < 90; i++) {
      valuesPackageLost.push(new PackageLost(1, 'Edje', '44.001', timePackage - 5000));
      valuesPackageLost.push(new PackageLost(10, 'Chrome', '80.0.3987.122', timePackage - 10000));
      timePackage = timePackage - 10000;
    }

    return valuesPackageLost;
  }
}
