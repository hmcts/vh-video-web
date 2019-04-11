import { TestBed, async, inject } from '@angular/core/testing';

import { JudgeGuard } from './judge.guard';
import { RouterTestingModule } from '@angular/router/testing';
import { SharedModule } from '../shared/shared.module';

describe('JudgeGuard', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [RouterTestingModule, SharedModule],
      providers: [JudgeGuard]
    });
  });

  it('should ...', inject([JudgeGuard], (guard: JudgeGuard) => {
    expect(guard).toBeTruthy();
  }));
});
