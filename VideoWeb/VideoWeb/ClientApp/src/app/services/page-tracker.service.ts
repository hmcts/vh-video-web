import { Injectable } from '@angular/core';
import { Router, ResolveEnd, NavigationEnd, ActivatedRouteSnapshot } from '@angular/router';
import { pairwise, filter } from 'rxjs/operators';

@Injectable()
export class PageTrackerService {

    PREVIOUS_ROUTE = 'PREVIOUS_ROUTE';
    constructor() { }

    trackNavigation(router: Router) {
        router.events.pipe(
            filter(event => event instanceof ResolveEnd)
        ).subscribe((event: ResolveEnd) => this.logPageResolved(event));
    }

    trackPreviousPage(router: Router) {
        router.events.pipe(
            filter(e => e instanceof NavigationEnd),
            pairwise()
        ).subscribe((e) => {
            sessionStorage.setItem(this.PREVIOUS_ROUTE, e[0]['url']);
        });
    }

    getPreviousUrl() {
        return sessionStorage.getItem(this.PREVIOUS_ROUTE);
    }

    private logPageResolved(event: ResolveEnd): void {
        const activatedComponent = this.getActivatedComponent(event.state.root);
        console.log(activatedComponent);
    }

    private getActivatedComponent(snapshot: ActivatedRouteSnapshot): any {
        if (snapshot.firstChild) {
            return this.getActivatedComponent(snapshot.firstChild);
        }

        return snapshot.component;
    }
}
