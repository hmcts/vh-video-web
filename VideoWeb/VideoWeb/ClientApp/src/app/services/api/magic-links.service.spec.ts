import { getTestBed, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { MagicLinksService } from './magic-links.service';

describe('MagicLinksService', () => {
    let service: MagicLinksService;
    let httpMock: HttpTestingController;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],
            providers: [MagicLinksService]
        });

        const testBed = getTestBed();
        service = testBed.inject(MagicLinksService);
        httpMock = testBed.inject(HttpTestingController);
    });

    describe('validateMagicLink', () => {
        it('should call the api for validation', () => {
            const hearingId = 'd1faff56-aa5e-45d5-8ec5-67e7840b1f6d';
            service.validateMagicLink(hearingId).subscribe(() => {
                httpMock.verify();
            });

            const request = httpMock.expectOne(req => req.url.includes(`/quickjoin/validateMagicLink/${hearingId}`));
            expect(request.request.method).toBe('GET');
            request.flush({});
        });
    });
});
