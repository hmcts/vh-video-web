import { getTestBed, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { MagicLinksService } from './magic-links.service';
import { Role } from '../clients/api-client';

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

    describe('getMagicLinkParticipantRoles', () => {
        it('should call the api to get magic link participant roles', () => {
            const response = [Role.MagicLinkParticipant];
            service.getMagicLinkParticipantRoles().subscribe(res => {
                expect(res).toBe(response);
                httpMock.verify();
            });

            const request = httpMock.expectOne(req => req.url.includes('/quickjoin/GetMagicLinkParticipantRoles'));
            expect(request.request.method).toBe('GET');
            request.flush(response);
        });
    });

    describe('validateMagicLink', () => {
        it('should call the api for validation', () => {
            const hearingId = 'd1faff56-aa5e-45d5-8ec5-67e7840b1f6d';
            const response = false;
            service.validateMagicLink(hearingId).subscribe(res => {
                expect(res).toBe(response);
                httpMock.verify();
            });

            const request = httpMock.expectOne(req => req.url.includes(`/quickjoin/validateMagicLink/${hearingId}`));
            expect(request.request.method).toBe('GET');
            request.flush(response);
        });
    });
});
