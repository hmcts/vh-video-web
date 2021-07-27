import { TestBed } from '@angular/core/testing';

import { BackNavigationService } from './back-navigation.service';

describe('BackNavigationService', () => {
  let service: BackNavigationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(BackNavigationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
