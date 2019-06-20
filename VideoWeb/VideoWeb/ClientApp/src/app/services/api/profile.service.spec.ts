import { TestBed, inject } from '@angular/core/testing';

import { ProfileService } from './profile.service';
import { SharedModule } from '../../shared/shared.module';

describe('ProfileService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [SharedModule],
      providers: [ProfileService]
    });
  });

  it('should be created', inject([ProfileService], (service: ProfileService) => {
    expect(service).toBeTruthy();
  }));
});
