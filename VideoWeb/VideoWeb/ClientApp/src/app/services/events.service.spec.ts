import { inject, TestBed } from '@angular/core/testing';
import * as signalR from '@microsoft/signalr';
import { AdalService } from 'adal-angular4';
import { MockAdalService } from '../testing/mocks/MockAdalService';
import { MockConfigService } from '../testing/mocks/MockConfigService';
import { MockLogger } from '../testing/mocks/MockLogger';
import { ConfigService } from './api/config.service';
import { EventsService } from './events.service';
import { Logger } from './logging/logger-base';

describe('EventsService', () => {
    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                EventsService,
                { provide: AdalService, useClass: MockAdalService },
                { provide: ConfigService, useClass: MockConfigService },
                { provide: Logger, useClass: MockLogger }
            ]
        });
    });

    it('should start if not connected', inject([EventsService], async (service: EventsService) => {
        spyOn(service.connection, 'start').and.callFake(() => Promise.resolve());
        await service.start();
        expect(service.reconnectionAttempt).toBe(0);
    }));
    it('should not start if connected', inject([EventsService], (service: EventsService) => {
        const spy = spyOnProperty(service.connection, 'state').and.returnValue(signalR.HubConnectionState.Disconnected);
        spyOn(service.connection, 'start').and.callFake(() => {
            spy.and.returnValue(signalR.HubConnectionState.Connected);
            return Promise.resolve();
        });
        service.start();
        service.start();
        expect(service.connection.start).toHaveBeenCalledTimes(1);
    }));
    it('should stop', inject([EventsService], (service: EventsService) => {
        spyOn(service.connection, 'stop').and.callFake(() => Promise.resolve());
        service.stop();
        expect(service.connection.stop).toHaveBeenCalled();
    }));
});
