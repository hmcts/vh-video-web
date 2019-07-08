import { TestBed, inject } from '@angular/core/testing';
import { DeviceType } from './device-type';
import { DeviceDetectorService } from 'ngx-device-detector';

describe('DeviceType', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [DeviceDetectorService]
    });
  });

  it('should return false for a mobile device', inject([DeviceDetectorService], (deviceDetectorService: DeviceDetectorService) => {
    const deviceType = new DeviceType(deviceDetectorService);
    expect(deviceType.isMobile()).toBeFalsy();
  }));
  it('should return true for a desktop device', inject([DeviceDetectorService], (deviceDetectorService: DeviceDetectorService) => {
    const deviceType = new DeviceType(deviceDetectorService);
    expect(deviceType.isDesktop()).toBeTruthy();
  }));
});
