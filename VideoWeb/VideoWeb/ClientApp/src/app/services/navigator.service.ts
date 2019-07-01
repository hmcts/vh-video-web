import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class NavigatorService {
  browser = <any>navigator;

  constructor() { }

  isDeviceComputer(): boolean {
    const deviceType = this.navigatorDeviceInfo();
    return deviceType === 'Computer';
  }

  navigatorDeviceInfo() {
    let typeOfDevice = '';
    if (this.browser.userAgent.match(/mobile/i)) {
      typeOfDevice = 'Mobile';
    } else if (this.browser.userAgent.match(/iPad|Android|Touch/i)) {
      typeOfDevice = 'Tablet';
    } else {
      typeOfDevice = 'Computer';
    }
    return typeOfDevice;
  }
}
