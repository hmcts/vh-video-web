import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { MagicLinksService } from 'src/app/services/api/magic-links.service';
import { ErrorService } from 'src/app/services/error.service';

@Injectable({
    providedIn: 'root'
})
export class ValidMagicLinkGuard implements CanActivate {
    constructor(private magicLinksService: MagicLinksService, private errorService: ErrorService) {}

    canActivate(
        routeSnapshot: ActivatedRouteSnapshot,
        state: RouterStateSnapshot
    ): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
        return this.magicLinksService.validateMagicLink(routeSnapshot.paramMap.get('hearingId')).pipe(
            tap(isValid => {
                if (!isValid) {
                    this.errorService.goToServiceError(
                        `The link you've used can't be recognised`,
                        `Please check the link you were sent. If it still doesn't work, call 0300 303 0655 for immediate contact with a video hearings officer.`,
                        false
                    );
                }
            })
        );
    }
}
