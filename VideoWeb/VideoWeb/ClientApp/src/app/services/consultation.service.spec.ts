import { TestBed, inject } from '@angular/core/testing';

import { ConsultationService } from './consultation.service';
import { SharedModule } from '../shared/shared.module';

describe('ConsultationService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [SharedModule],
      providers: [ConsultationService]
    });
  });

  it('should be created', inject([ConsultationService], (service: ConsultationService) => {
    expect(service).toBeTruthy();
  }));
});
