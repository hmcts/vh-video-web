import { Injectable } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter, pairwise } from 'rxjs/operators';
import { Logger } from './logging/logger-base';

@Injectable()
export class PageTrackerService {
    PREVIOUS_ROUTE = 'PREVIOUS_ROUTE';
    constructor(private logger: Logger) {}

    trackPreviousPage(router: Router) {
        router.events
            .pipe(
                filter(e => e instanceof NavigationEnd),
                pairwise()
            )
            .subscribe((e: [NavigationEnd, NavigationEnd]) => {
                const pageUrl = e[1].urlAfterRedirects;
                this.logger.event('PageNavigation', { pageUrl });
                sessionStorage.setItem(this.PREVIOUS_ROUTE, e[0]['url']);
            });
    }

    getPreviousUrl() {
        return sessionStorage.getItem(this.PREVIOUS_ROUTE);
    }
}
