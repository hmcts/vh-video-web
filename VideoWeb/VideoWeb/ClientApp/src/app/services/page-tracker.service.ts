import { Injectable } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { pairwise, filter } from 'rxjs/operators';

@Injectable()
export class PageTrackerService {
    PREVIOUS_ROUTE = 'PREVIOUS_ROUTE';
    constructor() {}

    trackPreviousPage(router: Router) {
        router.events
            .pipe(
                filter(e => e instanceof NavigationEnd),
                pairwise()
            )
            .subscribe(e => {
                sessionStorage.setItem(this.PREVIOUS_ROUTE, e[0]['url']);
            });
    }

    getPreviousUrl() {
        return sessionStorage.getItem(this.PREVIOUS_ROUTE);
    }
}
