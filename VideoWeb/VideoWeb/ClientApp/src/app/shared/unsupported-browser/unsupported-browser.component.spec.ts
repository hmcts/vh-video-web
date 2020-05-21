import { DeviceTypeService } from 'src/app/services/device-type.service';
import { UnsupportedBrowserComponent } from './unsupported-browser.component';

describe('UnsupportedBrowserComponent', () => {
    let component: UnsupportedBrowserComponent;
    let deviceTypeServiceSpy: jasmine.SpyObj<DeviceTypeService>;
    const browserName = 'Opera';

    beforeAll(() => {
        deviceTypeServiceSpy = jasmine.createSpyObj<DeviceTypeService>(['getBrowserName']);
        deviceTypeServiceSpy.getBrowserName.and.returnValue(browserName);
    });

    beforeEach(() => {
        component = new UnsupportedBrowserComponent(deviceTypeServiceSpy);
    });

    it('should initalise with browser information', () => {
        expect(component.supportedBrowsers.length).toBeGreaterThan(0);
        expect(component.browserName).toBe(browserName);
    });
});
