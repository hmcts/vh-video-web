import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { UnsupportedBrowserComponent } from './unsupported-browser.component';
import { DeviceTypeService } from 'src/app/services/device-type.service';
import { configureTestSuite } from 'ng-bullet';

describe('UnsupportedBrowserComponent', () => {
  let component: UnsupportedBrowserComponent;
  let fixture: ComponentFixture<UnsupportedBrowserComponent>;
  let deviceTypeServiceSpy: jasmine.SpyObj<DeviceTypeService>;
  const browserName = 'Opera';

  configureTestSuite(() => {
    deviceTypeServiceSpy = jasmine.createSpyObj<DeviceTypeService>(['getBrowserName']);
    deviceTypeServiceSpy.getBrowserName.and.returnValue(browserName);
    TestBed.configureTestingModule({
      declarations: [ UnsupportedBrowserComponent ],
      providers: [
        { provide: DeviceTypeService, useValue: deviceTypeServiceSpy }
      ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(UnsupportedBrowserComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should initalise with browser information', () => {
    expect(component.supportedBrowsers.length).toBeGreaterThan(0);
    expect(component.browserName).toBe(browserName);
  });
});
