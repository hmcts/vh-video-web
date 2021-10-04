import { TestBed } from '@angular/core/testing';

import { ConsultationInviteService } from './consultation-invite.service';

describe('ConsultationInviteService', () => {
  let service: ConsultationInviteService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ConsultationInviteService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
