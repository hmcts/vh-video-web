import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { Observable } from 'rxjs';
import { filter, map, switchMap, timeout } from 'rxjs/operators';
import { SecurityConfigSetupService } from 'src/app/security/security-config-setup.service';
import { QuickLinksService } from 'src/app/services/api/quick-links.service';
import { ErrorService } from 'src/app/services/error.service';

@Injectable({
    providedIn: 'root'
})
export class ValidQuickLinkGuard implements CanActivate {
    constructor(
        private quickLinksService: QuickLinksService,
        private errorService: ErrorService,
        private translationService: TranslateService,
        private securityConfigSetupService: SecurityConfigSetupService
    ) {}

    canActivate(routeSnapshot: ActivatedRouteSnapshot): Observable<boolean> {
        return this.securityConfigSetupService.configSetup$.pipe(
            filter(setupComplete => setupComplete),
            timeout(30000),
            switchMap(() => {
                return this.quickLinksService.validateQuickLink(routeSnapshot.paramMap.get('hearingId')).pipe(
                    map(isValid => {
                        if (!isValid) {
                            this.errorService.goToServiceError(
                                this.translationService.instant('quick-participant-errors.invalid-page.heading'),
                                this.translationService.instant('quick-participant-errors.invalid-page.body'),
                                false
                            );
                            return false;
                        }
                        return true;
                    })
                );
            })
        );
    }
}
