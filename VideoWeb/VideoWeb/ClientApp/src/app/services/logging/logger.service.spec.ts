import { TestBed, inject } from '@angular/core/testing';

import { LoggerService, LOG_ADAPTER } from './logger.service';
import { LogAdapter } from './log-adapter';

describe('LoggerService', () => {
  const logAdapter = jasmine.createSpyObj<LogAdapter>(['trackException', 'trackEvent']);

  beforeEach(() => TestBed.configureTestingModule({
    providers: [
      { provide: LOG_ADAPTER, useValue: logAdapter, multi: true }
    ]
  }));

  it('should be created', inject([LoggerService], (service: LoggerService) => {
    expect(service).toBeTruthy();
  }));

  it('should log events to all adapters', inject([LoggerService], (service: LoggerService) => {
    const properties = {};
    service.event('event', properties);

    expect(logAdapter.trackEvent).toHaveBeenCalledWith('event', properties);
  }));

  it('should log errors to all adapters', inject([LoggerService], (service: LoggerService) => {
    const error = new Error();
    const properties = {};
    service.error('error', error, properties);

    expect(logAdapter.trackException).toHaveBeenCalledWith('error', error, properties);
  }));
});
