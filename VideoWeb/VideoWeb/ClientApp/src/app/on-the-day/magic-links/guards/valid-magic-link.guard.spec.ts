import { fakeAsync, flush } from '@angular/core/testing';
import { ActivatedRouteSnapshot } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { Subject } from 'rxjs';
import { MagicLinksService } from 'src/app/services/api/magic-links.service';
import { ErrorService } from 'src/app/services/error.service';
import { ValidMagicLinkGuard } from './valid-magic-link.guard';

describe('ValidMagicLinkGuard', () => {
    const headingKey = 'magic-participant-errors.invalid-page.heading';
    const bodyKey = 'magic-participant-errors.invalid-page.body';

    let guard: ValidMagicLinkGuard;
    let magicLinksServiceSpy: jasmine.SpyObj<MagicLinksService>;
    let validateMagicLinkSubject: Subject<boolean>;
    let errorServiceSpy: jasmine.SpyObj<ErrorService>;
    let translateServiceSpy: jasmine.SpyObj<TranslateService>;

    beforeEach(() => {
        magicLinksServiceSpy = jasmine.createSpyObj<MagicLinksService>('MagicLinksService', ['validateMagicLink']);
        validateMagicLinkSubject = new Subject<boolean>();
        magicLinksServiceSpy.validateMagicLink.and.returnValue(validateMagicLinkSubject.asObservable());

        errorServiceSpy = jasmine.createSpyObj<ErrorService>('ErrorService', ['goToServiceError']);

        translateServiceSpy = jasmine.createSpyObj<TranslateService>('TranslateService', ['instant']);
        translateServiceSpy.instant.and.callFake(key => key);

        guard = new ValidMagicLinkGuard(magicLinksServiceSpy, errorServiceSpy, translateServiceSpy);
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
            validateMagicLinkSubject.next(false);
            flush();

            // Expect
            expect(magicLinksServiceSpy.validateMagicLink).toHaveBeenCalledOnceWith(headingId);
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
            validateMagicLinkSubject.next(true);
            flush();

            // Expect
            expect(magicLinksServiceSpy.validateMagicLink).toHaveBeenCalledOnceWith(headingId);
            expect(translateServiceSpy.instant).not.toHaveBeenCalled();
            expect(errorServiceSpy.goToServiceError).not.toHaveBeenCalled();
        }));
    });
});
