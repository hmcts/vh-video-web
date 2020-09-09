import { inject, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { pageUrls } from '../shared/page-url.constants';
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

        router = TestBed.inject(Router);
    });

    it('should do nothing if skip redirect is true', inject([ErrorService], (service: ErrorService) => {
        spyOn(router, 'navigate').and.returnValue(Promise.resolve(true));
        const error = { status: 401, isApiException: true };

        service.handleApiError(error, true);

        expect(router.navigate).toHaveBeenCalledTimes(0);
    }));

    it('should do nothing if error is not an api exception', inject([ErrorService], (service: ErrorService) => {
        spyOn(router, 'navigate').and.returnValue(Promise.resolve(true));
        const error = { message: 'this is a standard error' };

        service.handleApiError(error);

        expect(router.navigate).toHaveBeenCalledTimes(0);
    }));

    it('should navigate to unauthorised', inject([ErrorService], (service: ErrorService) => {
        spyOn(router, 'navigate').and.returnValue(Promise.resolve(true));
        const error = { status: 401, isApiException: true };
        service.handleApiError(error);
        expect(router.navigate).toHaveBeenCalledWith([pageUrls.Unauthorised]);
    }));

    it('should navigate to not found', inject([ErrorService], (service: ErrorService) => {
        spyOn(router, 'navigate').and.returnValue(Promise.resolve(true));
        const error = { status: 404, isApiException: true };
        service.handleApiError(error);
        expect(router.navigate).toHaveBeenCalledWith([pageUrls.NotFound]);
    }));

    it('should navigate to service error', inject([ErrorService], (service: ErrorService) => {
        spyOn(router, 'navigate').and.returnValue(Promise.resolve(true));
        const error = { status: 500, isApiException: true };
        service.handleApiError(error);
        expect(router.navigate).toHaveBeenCalledWith([pageUrls.ServiceError]);
    }));

    it('should return false when error not an ApiException during unauthorised check', inject([ErrorService], (service: ErrorService) => {
        const error = { message: 'this is a standard error' };
        expect(service.returnHomeIfUnauthorised(error)).toBeFalsy();
    }));

    it('should return false when error not a 401 ApiException during unauthorised check', inject(
        [ErrorService],
        (service: ErrorService) => {
            const error = { status: 500, isApiException: true };
            expect(service.returnHomeIfUnauthorised(error)).toBeFalsy();
        }
    ));

    it('should return true and navigate to home when error is a 401 ApiException during unauthorised check', inject(
        [ErrorService],
        (service: ErrorService) => {
            spyOn(router, 'navigate').and.returnValue(Promise.resolve(true));
            const error = { status: 401, isApiException: true };
            expect(service.returnHomeIfUnauthorised(error)).toBeTruthy();
            expect(router.navigate).toHaveBeenCalledWith([pageUrls.Home]);
        }
    ));
});
