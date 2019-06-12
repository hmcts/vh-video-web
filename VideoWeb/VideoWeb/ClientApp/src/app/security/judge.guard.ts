import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { ProfileService } from '../services/profile.service';
import { UserProfileResponse, UserRole } from '../services/clients/api-client';
import { map, catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class JudgeGuard implements CanActivate {

  constructor(
    private userProfileService: ProfileService,
    private router: Router) {
  }

  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean> {
    return this.userProfileService.getUserProfile().pipe(
      map((profile: UserProfileResponse) => {
        if (profile.role === UserRole.Judge) {
          return true;
        } else {
          this.router.navigate(['/home']);
          return false;
        }
      }),
      catchError((err) => {
        console.error(`Could not get user identity.`);
        console.error(err);
        this.router.navigate(['/logout']);
        return of(false);
      })
    );
  }
}
