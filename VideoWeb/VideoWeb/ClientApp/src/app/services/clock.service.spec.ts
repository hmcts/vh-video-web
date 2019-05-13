import { TestBed, inject } from '@angular/core/testing';

import { ClockService } from './clock.service';

describe('ClockServiceService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ClockService]
    });
  });

  it('should be created', inject([ClockService], (service: ClockService) => {
    expect(service).toBeTruthy();
  }));
});
