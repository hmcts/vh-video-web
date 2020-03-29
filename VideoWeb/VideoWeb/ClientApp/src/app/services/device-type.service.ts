import { Injectable } from '@angular/core';
import { DeviceDetectorService } from 'ngx-device-detector';

@Injectable({
  providedIn: 'root'
})
export class DeviceTypeService {

  constructor(private deviceDetectorService: DeviceDetectorService) {
  }

  isMobile(): boolean {
    return this.deviceDetectorService.isMobile();
  }

  isTablet(): boolean {
    return this.deviceDetectorService.isTablet();
  }

  isDesktop(): boolean {
    return this.deviceDetectorService.isDesktop();
  }

  isSupportedBrowser(): boolean {
    const supportedBrowsers = ['Firefox', 'Safari', 'Chrome', 'MS-Edge', 'Edg'];
    const browser = this.deviceDetectorService.browser;
    return supportedBrowsers.findIndex(x => x.toUpperCase() === browser.toUpperCase()) > -1;
  }

  getBrowserName(): string {
    return this.deviceDetectorService.browser;
  }

  getBrowserVersion(): string {
    return this.deviceDetectorService.browser_version;
  }
}
