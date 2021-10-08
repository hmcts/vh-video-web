import { TestBed } from '@angular/core/testing';

import { AudioOnlyImageService } from './audio-only-image.service';

describe('AudioOnlyImageServiceService', () => {
    let service: AudioOnlyImageService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(AudioOnlyImageService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });
});
