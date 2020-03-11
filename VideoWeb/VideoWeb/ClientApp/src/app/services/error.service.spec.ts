import { inject, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { PageUrls } from '../shared/page-url.constants';
import { MockLogger } from '../testing/mocks/MockLogger';
import { ErrorService } from './error.service';
import { Logger } from './logging/logger-base';

describe('ErrorService', () => {
    let router: Router;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [RouterTestingModule],
            providers: [ErrorService, { provide: Logger, useClass: MockLogger }]
        });

        router = TestBed.get(Router);
    });

    it('should be created', inject([ErrorService], (service: ErrorService) => {
        expect(service).toBeTruthy();
    }));

    it('should navigate to unauthorised', inject([ErrorService], (service: ErrorService) => {
        spyOn(router, 'navigate').and.callFake(() => {});
        const error = { status: 401, isApiException: true };
        service.handleApiError(error);
        expect(router.navigate).toHaveBeenCalledWith([PageUrls.Unauthorised]);
    }));

    it('should navigate to not found', inject([ErrorService], (service: ErrorService) => {
        spyOn(router, 'navigate').and.callFake(() => {});
        const error = { status: 404, isApiException: true };
        service.handleApiError(error);
        expect(router.navigate).toHaveBeenCalledWith([PageUrls.NotFound]);
    }));

    it('should navigate to service error', inject([ErrorService], (service: ErrorService) => {
        spyOn(router, 'navigate').and.callFake(() => {});
        const error = { status: 500, isApiException: true };
        service.handleApiError(error);
        expect(router.navigate).toHaveBeenCalledWith([PageUrls.ServiceError]);
    }));
});
