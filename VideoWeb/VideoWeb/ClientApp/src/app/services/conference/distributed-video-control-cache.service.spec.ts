import { TestBed } from '@angular/core/testing';

import { DistributedVideoControlCacheService } from './distributed-video-control-cache.service';

describe('DistributedVideoControlCacheService', () => {
    let service: DistributedVideoControlCacheService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(DistributedVideoControlCacheService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });
});
