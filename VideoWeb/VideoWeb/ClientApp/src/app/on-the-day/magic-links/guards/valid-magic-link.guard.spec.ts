import { TestBed } from '@angular/core/testing';

import { ValidMagicLinkGuard } from './valid-magic-link.guard';

describe('ValidMagicLinkGuard', () => {
  let guard: ValidMagicLinkGuard;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    guard = TestBed.inject(ValidMagicLinkGuard);
  });

  it('should be created', () => {
    expect(guard).toBeTruthy();
  });
});
