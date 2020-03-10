import { Injectable } from '@angular/core';
import { PackageLost } from '../services/models/package-lost';
import { GraphData } from '../services/models/graph-data';
import { GraphSettings } from '../services/models/graph-settings';
import { UnsupportedBrowserHeartbeat } from '../services/models/unsupported-browser-heartbeat';

@Injectable({
  providedIn: 'root'
})
export class MonitorGraphService {

  MS_PER_MINUTE = 60000;
  HEARTBEAT_INTERVAL = 5000;
  MAX_LOST = 20;
  timestampNow: number;
  timeStartPast: number;
  unsupportedBroswer: UnsupportedBrowserHeartbeat[] = [];

  constructor() {
    this.setUnsupportedBrowser();
  }

  setUnsupportedBrowser() {
    this.unsupportedBroswer.push(new UnsupportedBrowserHeartbeat('Safari', null));
    this.unsupportedBroswer.push(new UnsupportedBrowserHeartbeat('Edge', '44.19041'));
  }

  isUnsupportedBrowser(packageLost: PackageLost): boolean {
    const browserInfo = this.unsupportedBroswer.find(x => x.name === packageLost.browserName);
    if (!browserInfo) {
      return false;
    }

    if (browserInfo.version === null) {
      return true;
    }

    return this.compareVersions(browserInfo.version, packageLost.browserVersion);
  }

  private compareVersions(unsupportedBrowserVersion:string, versionBrowserToCheck:string): boolean {
    const unsupportedVersion = unsupportedBrowserVersion.split('.');
    const versionToCheck = versionBrowserToCheck.split('.');
    const minIndex = Math.min(unsupportedVersion.length, versionToCheck.length);
    let result = false;
    for (var i = 0; i < minIndex - 1; i++) {
      if (versionToCheck[i] <= unsupportedVersion[i]) {
        result = true;
        break;
      }
    }
    return result;
  }

  transferPackagesLost(values: PackageLost[]): number[] {
    let packagesLostValues: GraphData[] = [];
    let graphPoints = Array(GraphSettings.MAX_RECORDS).fill(NaN);

    this.timestampNow = new Date(Date.now()).getTime();
   
    if (values.length > 0) {

      // get starting point for timestamp from time 'now' or last heartbeat if its in the 5 sec from now.
      this.timestampNow = this.timestampNow - this.HEARTBEAT_INTERVAL <= values[values.length - 1].timestamp
        ? values[values.length - 1].timestamp : this.timestampNow;

      packagesLostValues = values.map(x => this.getPointValue(x));
    }

    packagesLostValues.forEach(x => {
      if (x && x.pointX) {
        graphPoints[x.pointX] = x.pointY;
      }
    });

    return graphPoints;
  }

  private getPointValue(packageLost: PackageLost): GraphData {
    if (!packageLost) {
      return null;
    }

    const graphData = new GraphData();

    // converts package lost value in the signal strength,
    // if package lost >= 20 then signal = 0, bad
    // otherwise 20 minus package lost value, the good signal is 20 (0-package lost)

    graphData.pointY = packageLost.recentPackageLost >= this.MAX_LOST ? this.MAX_LOST : this.MAX_LOST - packageLost.recentPackageLost;

    if (this.timestampNow >= packageLost.timestamp) {

      // defines position of the heartbeat value (y-axise) by timestamp in the data array (x-axise)
      // we have start point (time now ) and every 5 sec we have new value for hartbeat.
      // by deviding the difference between start point and current hearbeat value on 5 sec we get index position in the array
      // if there is some break in heartbeat stream then the associated elements of array have value NaN (no graph line)

      let xIndex = Math.round((this.timestampNow - packageLost.timestamp) / this.HEARTBEAT_INTERVAL);
      xIndex = xIndex > GraphSettings.MAX_RECORDS ? GraphSettings.MAX_RECORDS : xIndex;

      graphData.pointX = (GraphSettings.MAX_RECORDS - xIndex);
    } else {
      graphData.pointX = GraphSettings.MAX_RECORDS;
    }
    return graphData;
  }


  getTestData(): PackageLost[] {
    //just for fake data test
    let list: PackageLost[] = [];

    this.timestampNow = new Date(Date.now()).getTime();
    this.timeStartPast = this.timestampNow - (15 * this.MS_PER_MINUTE);

    const dnow = this.timestampNow;
    console.log('NOW DATE: ' + dnow);

    const dpast = this.timeStartPast;
    let tstamp = dpast;
    for (var i = 0; i < 180; i++) {
      let item = null;
      if (i === 0) {
        item = new PackageLost(1, '', '', dpast);
      }
      tstamp = tstamp + 5000;
      if (i < 60 && i > 0) {
        item = new PackageLost(11, '', '', tstamp);
      }
      else if (i >= 60 && i < 100) {
        item = new PackageLost(20, '', '', tstamp);
      }
      else if (i >= 100 && i < 150) {
        item = new PackageLost(5, '', '', tstamp);
      } else {
        item = new PackageLost(0, 'Edge', '79.0.309', tstamp);
      }
      console.log(item);
      list.push(item);
    }

    return list;
  }

  getTestData1(): PackageLost[] {
    //just for fake data test
    let list: PackageLost[] = [];

    this.timestampNow = new Date(Date.now()).getTime();
    this.timeStartPast = this.timestampNow - (15 * this.MS_PER_MINUTE);
    const dpast = this.timeStartPast - 1000;
    console.log('PAST DATE: ' + dpast);
    console.log('NOW DATE: ' + this.timestampNow);

    let tstamp = dpast;
    for (var i = 0; i < 180; i++) {
      let item = null;
      if (i === 0) {
        item = new PackageLost(1, '', '', dpast);
      } else {
        tstamp = tstamp + 5000;
        if (i > 30) {
          item = new PackageLost(11, '', '', tstamp);
        }
      }
      console.log(item);
      list.push(item);
    }

    return list;
  }
}
