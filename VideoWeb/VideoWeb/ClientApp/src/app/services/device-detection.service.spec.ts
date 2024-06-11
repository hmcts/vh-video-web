import { DeviceDetectionService } from './device-detection.service';
import { Logger } from 'src/app/services/logging/logger-base';

describe('DeviceDetectionService', () => {
    let service: DeviceDetectionService;
    let logger: jasmine.SpyObj<Logger>;

    beforeEach(() => {
        logger = jasmine.createSpyObj('Logger', ['info']);
        service = new DeviceDetectionService(logger);
        service.setLoggerPrefix('TestPrefix');
    });

    it('should return true for iPhone user agent', () => {
        spyOnProperty(navigator, 'userAgent', 'get').and.returnValue(
            'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1'
        );
        const result = service.isMobileIOSDevice();
        expect(result).toBeTrue();
    });

    it('should return true for iPad user agent', () => {
        spyOnProperty(navigator, 'userAgent', 'get').and.returnValue(
            'Mozilla/5.0 (iPad; CPU OS 13_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0 Mobile/15E148 Safari/604.1'
        );
        const result = service.isMobileIOSDevice();
        expect(result).toBeTrue();
    });

    it('should return false for non-iOS mobile user agent', () => {
        spyOnProperty(navigator, 'userAgent', 'get').and.returnValue(
            'Mozilla/5.0 (Linux; Android 10; SM-G970F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/83.0.4103.106 Mobile Safari/537.36'
        );
        const result = service.isMobileIOSDevice();
        expect(result).toBeFalse();
    });
});
