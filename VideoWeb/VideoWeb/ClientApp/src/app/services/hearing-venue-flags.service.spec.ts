import { TestBed } from '@angular/core/testing';

import { HearingVenueFlagsService } from './hearing-venue-flags.service';

describe('HearingVenueFlagsService', () => {
    let service: HearingVenueFlagsService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(HearingVenueFlagsService);
    });

    it('IsHearingVenueScottish returns false by default', done => {
        service.HearingVenueIsScottish.subscribe(response => {
            expect(response).toBe(false);
            done();
        });
    });
});
