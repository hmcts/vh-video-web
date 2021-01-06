import { fakeAsync, tick } from '@angular/core/testing';
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
        service.status = true;
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

    it('should stop timer', fakeAsync(() => {
        // Arrange
        spyOn(XMLHttpRequest.prototype, 'open').and.callFake((method: string, url: string) => {});
        spyOn(XMLHttpRequest.prototype, 'send');

        // Act
        service.start();
        tick(5001);
        service.stopTimer();
        tick(60000);

        // Assert
        expect(XMLHttpRequest.prototype.open).toHaveBeenCalledTimes(2);
        expect(XMLHttpRequest.prototype.send).toHaveBeenCalledTimes(2);
    }));

    it('should stop timer if not started', () => {
        expect(() => service.stopTimer()).not.toThrow();
    });

    it('should setup interval and fire intial check and again every 5 seconds', fakeAsync(() => {
        // Arrange
        spyOn(XMLHttpRequest.prototype, 'open').and.callFake((method: string, url: string) => {});
        spyOn(XMLHttpRequest.prototype, 'send');

        service.start();
        for (let i = 1; i < 10; i++) {
            // Act
            tick(5001);

            // Assert
            expect(XMLHttpRequest.prototype.open).toHaveBeenCalledTimes(i + 1);
            expect(XMLHttpRequest.prototype.send).toHaveBeenCalledTimes(i + 1);
        }

        service.stopTimer();
    }));

    it('should only setup 1 interval even if start called multiple times', fakeAsync(() => {
        // Arrange
        spyOn(XMLHttpRequest.prototype, 'open').and.callFake((method: string, url: string) => {});
        spyOn(XMLHttpRequest.prototype, 'send');

        for (let i = 1; i < 10; i++) {
            // Act
            service.start();
            tick(5001);

            // Assert
            expect(XMLHttpRequest.prototype.open).toHaveBeenCalledTimes(i + 1);
            expect(XMLHttpRequest.prototype.send).toHaveBeenCalledTimes(i + 1);
        }

        service.stopTimer();
    }));

    it('should publish when status changes', () => {
        // Arrange
        spyOn(XMLHttpRequest.prototype, 'open').and.callFake((method: string, url: string) => {});
        spyOn(XMLHttpRequest.prototype, 'send').and.throwError('failed to send');
        let publishedState = true;
        let eventCount = 0;
        service.onConnectionStatusChange().subscribe(online => {
            publishedState = online;
            eventCount++;
        });

        // Act
        service.checkNow();

        // Assert
        expect(publishedState).toBe(false);
        expect(eventCount).toBe(1);
    });

    it('should not publish if state hasnt changed', () => {
        // Arrange
        spyOn(XMLHttpRequest.prototype, 'open').and.callFake((method: string, url: string) => {});
        spyOn(XMLHttpRequest.prototype, 'send').and.throwError('failed to send');
        let publishedState = true;
        let eventCount = 0;
        service.onConnectionStatusChange().subscribe(online => {
            publishedState = online;
            eventCount++;
        });

        // Act
        for (let i = 0; i < 10; i++) {
            service.checkNow();
        }

        // Assert
        expect(XMLHttpRequest.prototype.open).toHaveBeenCalledTimes(10);
        expect(XMLHttpRequest.prototype.send).toHaveBeenCalledTimes(10);
        expect(publishedState).toBe(false);
        expect(eventCount).toBe(1);
    });
});
