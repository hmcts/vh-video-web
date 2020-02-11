import { TestBed, inject } from '@angular/core/testing';

import { ChatHubService } from './chat-hub.service';
import { AdalService } from 'adal-angular4';
import { Logger } from './logging/logger-base';
import { MockLogger } from '../testing/mocks/MockLogger';
import { MockAdalService } from '../testing/mocks/MockAdalService';

describe('ChatHubService', () => {
    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [ChatHubService, { provide: AdalService, useClass: MockAdalService }, { provide: Logger, useClass: MockLogger }]
        });
    });

    it('should start if not connected', inject([ChatHubService], (service: ChatHubService) => {
        spyOn(service.connection, 'start').and.callFake(() => Promise.resolve(true));
        service.start();
        expect(service.connection.start).toHaveBeenCalled();
    }));

    it('should not start if connected', inject([ChatHubService], (service: ChatHubService) => {
        spyOn(service.connection, 'start').and.callFake(() => {
            service.connectionStarted = true;
            return Promise.resolve(true);
        });
        service.start();
        service.start();
        expect(service.connection.start).toHaveBeenCalledTimes(1);
    }));

    it('should stop', inject([ChatHubService], (service: ChatHubService) => {
        spyOn(service.connection, 'stop').and.callFake(() => Promise.resolve(true));
        service.stop();
        expect(service.connection.stop).toHaveBeenCalled();
    }));
});
