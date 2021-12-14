import { HttpClientModule } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { MockLogger } from 'src/app/testing/mocks/mock-logger';
import { Logger } from '../logging/logger-base';
import { DistributedVideoControlCacheService } from './distributed-video-control-cache.service';

describe('DistributedVideoControlCacheService', () => {
    let service: DistributedVideoControlCacheService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [HttpClientModule],
            providers: [{ provide: Logger, useClass: MockLogger }]
        });
        service = TestBed.inject(DistributedVideoControlCacheService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });
});
