import { MockLogger } from '../testing/mocks/MockLogger';
import { Logger } from './logging/logger-base';
import { ConnectionStatusService } from '../services/connection-status.service';

describe('ConnectionStatusService', () => {
    let service: ConnectionStatusService;
    const logger: Logger = new MockLogger();

    beforeAll(() => {
        service = new ConnectionStatusService(logger);
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
});
