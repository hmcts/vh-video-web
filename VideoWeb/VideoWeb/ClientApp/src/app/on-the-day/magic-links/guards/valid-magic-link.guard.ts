import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { MagicLinksService } from 'src/app/services/api/magic-links.service';
import { ErrorService } from 'src/app/services/error.service';

@Injectable({
    providedIn: 'root'
})
export class ValidMagicLinkGuard implements CanActivate {
    constructor(
        private magicLinksService: MagicLinksService,
        private errorService: ErrorService,
        private translationService: TranslateService
    ) {}

    canActivate(routeSnapshot: ActivatedRouteSnapshot): Observable<boolean> {
        return this.magicLinksService.validateMagicLink(routeSnapshot.paramMap.get('hearingId')).pipe(
            tap(isValid => {
                if (!isValid) {
                    this.errorService.goToServiceError(
                        this.translationService.instant('magic-participant-errors.invalid-page.heading'),
                        this.translationService.instant('magic-participant-errors.invalid-page.body'),
                        false
                    );
                }
            })
        );
    }
}
