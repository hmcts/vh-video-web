import { TestBed, inject } from '@angular/core/testing';
import { DeviceTypeService } from './device-type.service';
import { DeviceDetectorService } from 'ngx-device-detector';

describe('DeviceType', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [DeviceDetectorService]
    });
  });

  it('should return false for a mobile device', inject([DeviceDetectorService], (deviceDetectorService: DeviceDetectorService) => {
    const deviceType = new DeviceTypeService(deviceDetectorService);
    expect(deviceType.isMobile()).toBeFalsy();
  }));
  it('should return true for a desktop device', inject([DeviceDetectorService], (deviceDetectorService: DeviceDetectorService) => {
    const deviceType = new DeviceTypeService(deviceDetectorService);
    expect(deviceType.isDesktop()).toBeTruthy();
  }));
});
