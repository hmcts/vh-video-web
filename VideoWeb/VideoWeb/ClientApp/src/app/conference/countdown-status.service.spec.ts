import { TestBed } from '@angular/core/testing';

import { CountdownStatusService } from './countdown-status.service';

describe('CountdownStatusService', () => {
  let service: CountdownStatusService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CountdownStatusService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
