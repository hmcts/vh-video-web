import { DeviceDetectorService, OS } from 'ngx-device-detector';
import { browsers } from '../shared/browser.constants';
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
        { isTablet: true, os: 'Mac', expected: true },
        { isTablet: false, os: 'Mac', expected: false },
        { isTablet: true, os: 'ios', expected: true },
        { isTablet: false, os: 'ios', expected: false },
        { isTablet: false, os: 'Windows', expected: false }
    ];

    isIpadTestCases.forEach(test => {
        it(`should return is iPad: ${test.expected} when tablet is ${test.isTablet}, os is ${test.os}`, () => {
            deviceDetectorService.isTablet.and.returnValue(test.isTablet);
            deviceDetectorService.os = test.os;

            expect(service.isIpad()).toBe(test.expected);
        });
    });

    const isIphoneTestCases = [
        { isMobile: true, os: 'Mac', expected: true },
        { isMobile: false, os: 'Mac', expected: false },
        { isMobile: true, os: 'ios', expected: true },
        { isMobile: false, os: 'ios', expected: false },
        { isMobile: false, os: 'Windows', expected: false }
    ];

    isIphoneTestCases.forEach(test => {
        it(`should return is iPhone: ${test.expected} when mobile is ${test.isMobile}, os is ${test.os}`, () => {
            deviceDetectorService.isMobile.and.returnValue(test.isMobile);
            deviceDetectorService.os = test.os;

            expect(service.isIphone()).toBe(test.expected);
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

    it('should return the os name', () => {
        const testOsName = 'Mac OS';
        deviceDetectorService.os = testOsName;
        expect(service.getOSName()).toBe(testOsName);
    });

    it('should return the os version', () => {
        const testOsVersion = '1.2.3.4';
        deviceDetectorService.os_version = testOsVersion;
        expect(service.getOSVersion()).toBe(testOsVersion);
    });
    it('should return the device', () => {
        const testDeviceName = 'iPhone';
        deviceDetectorService.device = testDeviceName;
        expect(service.getDevice()).toBe(testDeviceName);
    });
    it('should return whether the OS is iOS', () => {
        deviceDetectorService.os = 'ios';
        expect(service.isIOS()).toBeTrue();

        deviceDetectorService.os = 'mac';
        expect(service.isIOS()).toBeTrue();

        deviceDetectorService.os = 'android';
        expect(service.isIOS()).toBeFalse();
    });

    it('should return whether the OS is Android', () => {
        deviceDetectorService.os = 'android';
        expect(service.isAndroid()).toBeTrue();

        deviceDetectorService.os = 'ios';
        expect(service.isAndroid()).toBeFalse();
    });

    const isSupportedBrowserTestCases = [
        { browser: browsers.Firefox, expected: true },
        { browser: browsers.Safari, expected: true },
        { browser: browsers.Chrome, expected: true },
        { browser: browsers.MSEdge, expected: true },
        { browser: browsers.Samsung, expected: true },
        { browser: browsers.MSEdgeChromium, expected: true },
        { browser: browsers.Opera, expected: false },
        { browser: browsers.Brave, expected: false },
        { browser: browsers.MSInternetExplorer, expected: false }
    ];

    isSupportedBrowserTestCases.forEach(test => {
        it(`should return ${test.expected} when browser is ${test.browser}`, () => {
            deviceDetectorService.isDesktop.and.returnValue(true);
            deviceDetectorService.os = 'windows 10';
            deviceDetectorService.browser = test.browser;
            expect(service.isSupportedBrowser()).toBe(test.expected);
        });
    });

    isSupportedBrowserTestCases.forEach(test => {
        it(`should return ${test.expected} when browser is ${test.browser}`, () => {
            deviceDetectorService.isDesktop.and.returnValue(true);
            deviceDetectorService.os = 'Mac';
            deviceDetectorService.browser = test.browser;
            expect(service.isSupportedBrowser()).toBe(test.expected);
        });
    });

    const isSupportedIOSBrowserTestCases = [
        { browser: browsers.Firefox, expected: false },
        { browser: browsers.Safari, expected: true },
        { browser: browsers.Chrome, expected: false },
        { browser: browsers.MSEdge, expected: false },
        { browser: browsers.Samsung, expected: false },
        { browser: browsers.MSEdgeChromium, expected: false },
        { browser: browsers.Opera, expected: false },
        { browser: browsers.Brave, expected: false },
        { browser: browsers.MSInternetExplorer, expected: false }
    ];

    isSupportedIOSBrowserTestCases.forEach(test => {
        it(`should return ${test.expected} when browser is ${test.browser}`, () => {
            deviceDetectorService.isDesktop.and.returnValue(false);
            deviceDetectorService.os = 'ios';
            deviceDetectorService.browser = test.browser;
            deviceDetectorService.device = 'iPhone';
            expect(service.isSupportedBrowser()).toBe(test.expected);
        });
    });

    describe('isSupportedBrowserForNetworkHealth', () => {
        beforeEach(() => {
            deviceDetectorService.isDesktop.and.returnValue(true);
            deviceDetectorService.os = OS.IOS;
        });

        describe('VH supports web browser', () => {
            it('should return false when network health is not supported', () => {
                deviceDetectorService.browser = browsers.MSEdge;
                const result = service.isSupportedBrowserForNetworkHealth();
                expect(result).toBeFalse();
            });

            it('should return true when network health is supported', () => {
                deviceDetectorService.browser = browsers.Chrome;
                const result = service.isSupportedBrowserForNetworkHealth();
                expect(result).toBeTrue();
            });
        });

        describe('VH does not support web browser', () => {
            it('should return false when network health is not supported', () => {
                deviceDetectorService.browser = 'Unsupported browser';
                const result = service.isSupportedBrowserForNetworkHealth();
                expect(result).toBeFalse();
            });
        });
    });

    describe('isHandheldIOSDevice', () => {
        it('should return true when device is iPhone', () => {
            deviceDetectorService.isMobile.and.returnValue(true);
            deviceDetectorService.os = OS.IOS;
            expect(service.isHandheldIOSDevice()).toBeTrue();
        });

        it('should return true when device is iPad', () => {
            deviceDetectorService.isTablet.and.returnValue(true);
            deviceDetectorService.os = OS.IOS;
            expect(service.isHandheldIOSDevice()).toBeTrue();
        });

        it('should return false when device is not iPhone or iPad', () => {
            deviceDetectorService.isMobile.and.returnValue(false);
            deviceDetectorService.isTablet.and.returnValue(false);
            expect(service.isHandheldIOSDevice()).toBeFalse();
        });
    });
});
