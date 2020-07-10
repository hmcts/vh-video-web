import { DeviceDetectorService } from 'ngx-device-detector';
import { DeviceTypeService } from './device-type.service';

describe('DeviceType', () => {
    let service: DeviceTypeService;
    let deviceDetectorService: jasmine.SpyObj<DeviceDetectorService>;

    beforeAll(() => {
        deviceDetectorService = jasmine.createSpyObj<DeviceDetectorService>('DeviceDetectorService', ['isMobile', 'isTablet', 'isDesktop']);
    });

    beforeEach(() => {
        service = new DeviceTypeService(deviceDetectorService);
    });

    const isMobileTestCases = [
        { isMobile: true, expected: true },
        { isMobile: false, expected: false }
    ];

    isMobileTestCases.forEach(test => {
        it(`should return is mobile: ${test.expected} when mobile device is ${test.isMobile}`, () => {
            deviceDetectorService.isMobile.and.returnValue(test.isMobile);
            expect(service.isMobile()).toBe(test.expected);
        });
    });

    const isTabletTestCases = [
        { isTablet: true, expected: true },
        { isTablet: false, expected: false }
    ];

    isTabletTestCases.forEach(test => {
        it(`should return is tablet: ${test.expected} when tablet device is ${test.isTablet}`, () => {
            deviceDetectorService.isTablet.and.returnValue(test.isTablet);
            expect(service.isTablet()).toBe(test.expected);
        });
    });

    const isDesktopTestCases = [
        { isDesktop: true, expected: true },
        { isDesktop: false, expected: false }
    ];

    isDesktopTestCases.forEach(test => {
        it(`should return is desktop: ${test.expected} when desktop device is ${test.isDesktop}`, () => {
            deviceDetectorService.isDesktop.and.returnValue(test.isDesktop);
            expect(service.isDesktop()).toBe(test.expected);
        });
    });

    const isIpadTestCases = [
        { isTablet: true, os: 'Mac', browser: 'Safari', expected: true },
        { isTablet: true, os: 'Mac', browser: 'Chrome', expected: false },
        { isTablet: true, os: 'Mac', browser: 'Firefox', expected: false },
        { isTablet: false, os: 'Mac', browser: 'Chrome', expected: false },
        { isTablet: false, os: 'Mac', browser: 'Firefox', expected: false },
        { isTablet: false, os: 'Windows', browser: 'Firefox', expected: false },
        { isTablet: false, os: 'Windows', browser: 'Chrome', expected: false },
        { isTablet: false, os: 'Windows', browser: 'MS-Edge-Chromium', expected: false }
    ];

    isIpadTestCases.forEach(test => {
        it(`should return is iPad: ${test.expected} when tablet is ${test.isTablet}, os is ${test.os} and browser is ${test.browser}`, () => {
            deviceDetectorService.isTablet.and.returnValue(test.isTablet);
            deviceDetectorService.os = test.os;
            deviceDetectorService.browser = test.browser;

            expect(service.isIpad()).toBe(test.expected);
        });
    });

    it('should return the browser name', () => {
        const testBrowser = 'Firefox';
        deviceDetectorService.browser = testBrowser;
        expect(service.getBrowserName()).toBe(testBrowser);
    });

    it('should return the browser version', () => {
        const testBrowserVersion = '1.2.3.4';
        deviceDetectorService.browser_version = testBrowserVersion;
        expect(service.getBrowserVersion()).toBe(testBrowserVersion);
    });

    const isSupportedBrowserTestCases = [
        { browser: 'Firefox', expected: true },
        { browser: 'Safari', expected: true },
        { browser: 'Chrome', expected: true },
        { browser: 'MS-Edge', expected: true },
        { browser: 'MS-Edge-Chromium', expected: true },
        { browser: 'Opera', expected: false },
        { browser: 'Brave', expected: false },
        { browser: 'MSIE', expected: false },
        { browser: 'MSIE', expected: false }
    ];

    isSupportedBrowserTestCases.forEach(test => {
        it(`should return ${test.expected} when browser is ${test.browser}`, () => {
            deviceDetectorService.browser = test.browser;
            expect(service.isSupportedBrowser()).toBe(test.expected);
        });
    });
});
