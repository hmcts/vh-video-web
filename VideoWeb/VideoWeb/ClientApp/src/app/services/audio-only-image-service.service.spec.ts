import { TestBed } from '@angular/core/testing';

import { AudioOnlyImageServiceService } from './audio-only-image-service.service';

describe('AudioOnlyImageServiceService', () => {
  let service: AudioOnlyImageServiceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AudioOnlyImageServiceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
