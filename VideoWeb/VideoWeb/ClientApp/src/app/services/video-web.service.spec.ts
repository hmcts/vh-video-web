import { TestBed, inject } from '@angular/core/testing';

import { VideoWebService } from './video-web.service';
import { SharedModule } from '../shared/shared.module';

describe('VideoWebService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [SharedModule],
      providers: [VideoWebService]
    });
  });

  it('should be created', inject([VideoWebService], (service: VideoWebService) => {
    expect(service).toBeTruthy();
  }));
});
