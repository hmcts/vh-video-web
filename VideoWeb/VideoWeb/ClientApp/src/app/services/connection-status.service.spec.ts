import { MockLogger } from '../testing/mocks/MockLogger';
import { Logger } from './logging/logger-base';
import { ConnectionStatusService } from '../services/connection-status.service';

describe('ConnectionStatusService', () => {
    let service: ConnectionStatusService;
    const logger: Logger = new MockLogger();

    beforeAll(() => {
        service = new ConnectionStatusService(logger);
    });

    beforeEach(function () {
        jasmine.clock().install();
    });

    afterEach(() => {
        jasmine.clock().uninstall();
    });

    it('should send request to check internet connection', () => {
        // Arrange
        spyOn(XMLHttpRequest.prototype, 'open').and.callFake((method: string, url: string) => {});
        spyOn(XMLHttpRequest.prototype, 'send');

        // Act
        service.checkNow();

        // Assert
        expect(XMLHttpRequest.prototype.open).toHaveBeenCalled();
        expect(XMLHttpRequest.prototype.send).toHaveBeenCalled();
    });

    it('should stop timer', () => {
        // Arrange
        spyOn(XMLHttpRequest.prototype, 'open').and.callFake((method: string, url: string) => {});
        spyOn(XMLHttpRequest.prototype, 'send');

        // Act
        service.start();
        jasmine.clock().tick(5001);
        service.stopTimer();
        jasmine.clock().tick(60000);

        // Assert
        expect(XMLHttpRequest.prototype.open).toHaveBeenCalledTimes(2);
        expect(XMLHttpRequest.prototype.send).toHaveBeenCalledTimes(2);
    });

    it('should stop timer if not started', () => {
        expect(() => service.stopTimer()).not.toThrow();
    });

    it('should setup interval and fire intial check and again every 5 seconds', () => {
        // Arrange
        spyOn(XMLHttpRequest.prototype, 'open').and.callFake((method: string, url: string) => {});
        spyOn(XMLHttpRequest.prototype, 'send');

        service.start();
        for (let i = 1; i < 10; i++) {
            // Act
            jasmine.clock().tick(5001);

            // Assert
            expect(XMLHttpRequest.prototype.open).toHaveBeenCalledTimes(i + 1);
            expect(XMLHttpRequest.prototype.send).toHaveBeenCalledTimes(i + 1);
        }

        service.stopTimer();
    });

    it('should only setup 1 interval even if start called multiple times', () => {
        // Arrange
        spyOn(XMLHttpRequest.prototype, 'open').and.callFake((method: string, url: string) => {});
        spyOn(XMLHttpRequest.prototype, 'send');

        for (let i = 1; i < 10; i++) {
            // Act
            service.start();
            jasmine.clock().tick(5001);

            // Assert
            expect(XMLHttpRequest.prototype.open).toHaveBeenCalledTimes(i + 1);
            expect(XMLHttpRequest.prototype.send).toHaveBeenCalledTimes(i + 1);
        }

        service.stopTimer();
    });
});
