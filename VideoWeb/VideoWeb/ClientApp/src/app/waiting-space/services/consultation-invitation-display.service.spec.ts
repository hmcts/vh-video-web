import { TestBed } from '@angular/core/testing';

import { ConsultationInvitationDisplayService } from './consultation-invitation-display.service';

describe('ConsultationInvitationDisplayService', () => {
  let service: ConsultationInvitationDisplayService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ConsultationInvitationDisplayService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
