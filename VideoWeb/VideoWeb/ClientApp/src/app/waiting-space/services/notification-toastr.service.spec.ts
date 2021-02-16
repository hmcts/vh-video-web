import { Logger } from 'src/app/services/logging/logger-base';
import { MockLogger } from 'src/app/testing/mocks/MockLogger';
import { consultationService, notificationSoundsService, toastrService } from '../waiting-room-shared/tests/waiting-room-base-setup';
import { NotificationToastrService } from './notification-toastr.service';

describe('NotificationToastrService', () => {
    let service: NotificationToastrService;
    const logger: Logger = new MockLogger();
    beforeAll(() => {

    });

    beforeEach(() => {
        service = new NotificationToastrService(logger, toastrService, consultationService, notificationSoundsService);
    });

    it('should create', async () => {
        expect(service).toBeTruthy();
    });
});
