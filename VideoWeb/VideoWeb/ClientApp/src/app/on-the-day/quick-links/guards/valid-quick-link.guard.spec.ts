import { fakeAsync, flush } from '@angular/core/testing';
import { ActivatedRouteSnapshot } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { Subject } from 'rxjs';
import { QuickLinksService } from 'src/app/services/api/quick-links.service';
import { ErrorService } from 'src/app/services/error.service';
import { ValidQuickLinkGuard } from './valid-quick-link.guard';

describe('ValidQuickLinkGuard', () => {
    const headingKey = 'quick-participant-errors.invalid-page.heading';
    const bodyKey = 'quick-participant-errors.invalid-page.body';

    let guard: ValidQuickLinkGuard;
    let quickLinksServiceSpy: jasmine.SpyObj<QuickLinksService>;
    let validateQuickLinkSubject: Subject<boolean>;
    let errorServiceSpy: jasmine.SpyObj<ErrorService>;
    let translateServiceSpy: jasmine.SpyObj<TranslateService>;

    beforeEach(() => {
        quickLinksServiceSpy = jasmine.createSpyObj<QuickLinksService>('QuickLinksService', ['validateQuickLink']);
        validateQuickLinkSubject = new Subject<boolean>();
        quickLinksServiceSpy.validateQuickLink.and.returnValue(validateQuickLinkSubject.asObservable());

        errorServiceSpy = jasmine.createSpyObj<ErrorService>('ErrorService', ['goToServiceError']);

        translateServiceSpy = jasmine.createSpyObj<TranslateService>('TranslateService', ['instant']);
        translateServiceSpy.instant.and.callFake(key => key);

        guard = new ValidQuickLinkGuard(quickLinksServiceSpy, errorServiceSpy, translateServiceSpy);
    });

    it('should be created', () => {
        expect(guard).toBeTruthy();
    });

    describe('canActivate', () => {
        it('should call goToServiceError if the link is NOT valid', fakeAsync(() => {
            // Arrange
            const headingId = 'heading-id';
            const routeSnapshot = ({
                paramMap: {
                    get: () => headingId
                }
            } as unknown) as ActivatedRouteSnapshot;

            // Act
            guard.canActivate(routeSnapshot).subscribe(() => {});
            validateQuickLinkSubject.next(false);
            flush();

            // Expect
            expect(quickLinksServiceSpy.validateQuickLink).toHaveBeenCalledOnceWith(headingId);
            expect(translateServiceSpy.instant).toHaveBeenCalledTimes(2);
            expect(translateServiceSpy.instant).toHaveBeenCalledWith(headingKey);
            expect(translateServiceSpy.instant).toHaveBeenCalledWith(bodyKey);
            expect(errorServiceSpy.goToServiceError).toHaveBeenCalledOnceWith(headingKey, bodyKey, false);
        }));

        it('should NOT call goToServiceError if the link is valid', fakeAsync(() => {
            // Arrange
            const headingId = 'heading-id';
            const routeSnapshot = ({
                paramMap: {
                    get: () => headingId
                }
            } as unknown) as ActivatedRouteSnapshot;

            // Act
            guard.canActivate(routeSnapshot).subscribe(() => {});
            validateQuickLinkSubject.next(true);
            flush();

            // Expect
            expect(quickLinksServiceSpy.validateQuickLink).toHaveBeenCalledOnceWith(headingId);
            expect(translateServiceSpy.instant).not.toHaveBeenCalled();
            expect(errorServiceSpy.goToServiceError).not.toHaveBeenCalled();
        }));
    });
});
