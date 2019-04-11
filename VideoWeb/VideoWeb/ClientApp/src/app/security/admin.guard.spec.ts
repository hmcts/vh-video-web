import { TestBed, async, inject } from '@angular/core/testing';

import { AdminGuard } from './admin.guard';
import { SharedModule } from '../shared/shared.module';
import { RouterTestingModule } from '@angular/router/testing';

describe('AdminGuard', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [RouterTestingModule, SharedModule],
      providers: [AdminGuard]
    });
  });

  it('should ...', inject([AdminGuard], (guard: AdminGuard) => {
    expect(guard).toBeTruthy();
  }));
});
