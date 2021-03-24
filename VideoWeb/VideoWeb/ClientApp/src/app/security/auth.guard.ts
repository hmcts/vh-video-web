import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AdalService } from 'adal-angular4';

@Injectable()
export class AuthGuard implements CanActivate {
    constructor(private adalSvc: AdalService, private router: Router) {}

    canActivate(): boolean {
        if (this.adalSvc.userInfo.authenticated) {
            return true;
        }
        this.router.navigate(['/login']);
        return false;
    }
}
