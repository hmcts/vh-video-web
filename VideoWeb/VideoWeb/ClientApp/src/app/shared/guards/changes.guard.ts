import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanDeactivate, Router, RouterStateSnapshot } from '@angular/router';
import { Observable } from 'rxjs';

@Injectable()
export class ChangesGuard implements CanDeactivate<CanDeactiveComponent> {
    constructor(private router: Router) {
    }

    canDeactivate(component: CanDeactiveComponent, route: ActivatedRouteSnapshot, state: RouterStateSnapshot,
        nextState?: RouterStateSnapshot) {
        if (nextState.url === '/home') {
            return component.hasChanges ? !component.hasChanges() : true;
        }
        return true;
    }
}

export interface CanDeactiveComponent {
    hasChanges: () => Observable<boolean> | Promise<boolean> | boolean;
}

