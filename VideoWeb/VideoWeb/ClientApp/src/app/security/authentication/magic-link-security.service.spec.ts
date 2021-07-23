import { TestBed } from '@angular/core/testing';

import { MagicLinkSecurityService } from './magic-link-security.service';

describe('MagicLinkSecurityService', () => {
    let service: MagicLinkSecurityService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(MagicLinkSecurityService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });
});
