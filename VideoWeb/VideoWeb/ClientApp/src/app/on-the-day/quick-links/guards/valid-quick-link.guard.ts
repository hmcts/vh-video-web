import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { QuickLinksService } from 'src/app/services/api/quick-links.service';
import { ErrorService } from 'src/app/services/error.service';

@Injectable({
    providedIn: 'root'
})
export class ValidQuickLinkGuard implements CanActivate {
    constructor(
        private quickLinksService: QuickLinksService,
        private errorService: ErrorService,
        private translationService: TranslateService
    ) {}

    canActivate(routeSnapshot: ActivatedRouteSnapshot): Observable<boolean> {
        return this.quickLinksService.validateQuickLink(routeSnapshot.paramMap.get('hearingId')).pipe(
            tap(isValid => {
                if (!isValid) {
                    this.errorService.goToServiceError(
                        this.translationService.instant('quick-participant-errors.invalid-page.heading'),
                        this.translationService.instant('quick-participant-errors.invalid-page.body'),
                        false
                    );
                }
            })
        );
    }
}
