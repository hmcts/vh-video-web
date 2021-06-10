import { TestBed } from '@angular/core/testing';

import { VideoControlService } from './video-control.service';

describe('VideoControlService', () => {
  let service: VideoControlService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(VideoControlService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
