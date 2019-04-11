import { TestBed, async, inject } from '@angular/core/testing';

import { ParticipantGuard } from './participant.guard';
import { RouterTestingModule } from '@angular/router/testing';
import { SharedModule } from '../shared/shared.module';

describe('ParticipantGuard', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [RouterTestingModule, SharedModule],
      providers: [ParticipantGuard]
    });
  });

  it('should ...', inject([ParticipantGuard], (guard: ParticipantGuard) => {
    expect(guard).toBeTruthy();
  }));
});
