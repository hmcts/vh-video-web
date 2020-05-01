import { TestBed } from '@angular/core/testing';

import { EventBusService } from './event-bus.service';

describe('EventBusService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: EventBusService = TestBed.get(EventBusService);
    expect(service).toBeTruthy();
  });
});
