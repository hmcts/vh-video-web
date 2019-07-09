import { TestBed, inject } from '@angular/core/testing';

import { EventsService } from './events.service';
import { AdalService } from 'adal-angular4';
import { MockAdalService } from '../testing/mocks/MockAdalService';
import { ConfigService } from './api/config.service';
import { MockConfigService } from '../testing/mocks/MockConfigService';
import { Logger } from './logging/logger-base';
import { MockLogger } from '../testing/mocks/MockLogger';

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

  it('should be created', inject([EventsService], (service: EventsService) => {
    expect(service).toBeTruthy();
    expect(service.eventServiceBaseUri).toBeDefined();
  }));

  it('should start if not connected', inject([EventsService], (service: EventsService) => {
    spyOn(service.connection, 'start').and.callFake(() => Promise.resolve(true));
    service.start();
    expect(service.connection.start).toHaveBeenCalled();
  }));

  it('should not start if connected', inject([EventsService], (service: EventsService) => {
    spyOn(service.connection, 'start').and.callFake(() => { service.connectionStarted = true; return Promise.resolve(true); });
    service.start();
    service.start();
    expect(service.connection.start).toHaveBeenCalledTimes(1);
  }));

  it('should stop', inject([EventsService], (service: EventsService) => {
    spyOn(service.connection, 'stop').and.callFake(() => Promise.resolve(true));
    service.stop();
    expect(service.connection.stop).toHaveBeenCalled();
  }));
});
