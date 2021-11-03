import { TestBed } from '@angular/core/testing';

import { HearingVenueFlagsService } from './hearing-venue-flags.service';

describe('HearingVenueFlagsService', () => {
    let service: HearingVenueFlagsService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(HearingVenueFlagsService);
    });

    it('getHearingVenueIsScottish returns current value', done => {
        service.hearingVenueIsScottish$.subscribe(response => {
            expect(response).toBe(false);
            done();
        });
    });

    it('setHearingVenueIsScottish updates current value', done => {
        service.setHearingVenueIsScottish(true);
        service.hearingVenueIsScottish$.subscribe(response => {
            expect(response).toBe(true);
            done();
        });
    });
});
