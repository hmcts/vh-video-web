import { TestBed, inject } from '@angular/core/testing';

import { ServerSentEventsService } from './server-sent-events.service';
import { AdalService } from 'adal-angular4';
import { MockAdalService } from '../testing/mocks/MockAdalService';
import { ConfigService } from './config.service';
import { MockConfigService } from '../testing/mocks/MockConfigService';
import { start } from 'repl';
import { ParticipantStatusMessage } from './models/participant-status-message';

describe('ServerSentEventsService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ServerSentEventsService,
        { provide: AdalService, useClass: MockAdalService },
        { provide: ConfigService, useClass: MockConfigService },
      ]
    });
  });

  it('should be created', inject([ServerSentEventsService], (service: ServerSentEventsService) => {
    expect(service).toBeTruthy();
    expect(service.eventServiceBaseUri).toBeDefined();
  }));

  it('should start if not connected', inject([ServerSentEventsService], (service: ServerSentEventsService) => {
    spyOn(service.connection, 'start').and.callFake(() => Promise.resolve(true));
    service.start();
    expect(service.connection.start).toHaveBeenCalled();
  }));

  it('should not start if connected', inject([ServerSentEventsService], (service: ServerSentEventsService) => {
    spyOn(service.connection, 'start').and.callFake(() => Promise.resolve(true));
    service.start();
    service.start();
    expect(service.connection.start).toHaveBeenCalledTimes(1);
  }));

  it('should stop', inject([ServerSentEventsService], (service: ServerSentEventsService) => {
    spyOn(service.connection, 'stop').and.callFake(() => Promise.resolve(true));
    service.stop();
    expect(service.connection.stop).toHaveBeenCalled();
  }));
});
