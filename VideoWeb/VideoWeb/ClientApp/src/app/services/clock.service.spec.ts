import { TestBed, inject } from '@angular/core/testing';

import { ClockServiceService } from './clock.service';

describe('ClockServiceService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ClockServiceService]
    });
  });

  it('should be created', inject([ClockServiceService], (service: ClockServiceService) => {
    expect(service).toBeTruthy();
  }));
});
