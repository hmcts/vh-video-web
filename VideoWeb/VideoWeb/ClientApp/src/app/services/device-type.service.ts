import { Injectable } from '@angular/core';
import { DeviceDetectorService } from 'ngx-device-detector';

@Injectable({
  providedIn: 'root'
})
export class DeviceTypeService {

  constructor(private deviceDetectorService: DeviceDetectorService) {
  }

  isMobile() {
    return this.deviceDetectorService.isMobile();
  }

  isTablet() {
    return this.deviceDetectorService.isTablet();
  }

  isDesktop() {
    return this.deviceDetectorService.isDesktop();
  }
}
