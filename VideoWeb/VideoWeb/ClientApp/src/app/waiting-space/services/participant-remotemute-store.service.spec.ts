import { TestBed } from '@angular/core/testing';

import { ParticipantRemotemuteStoreService } from './participant-remotemute-store.service';

describe('ParticipantRemotemuteStoreService', () => {
  let service: ParticipantRemotemuteStoreService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ParticipantRemotemuteStoreService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
