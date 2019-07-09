import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from '@angular/router';
import { ProfileService } from '../services/api/profile.service';
import { UserRole } from '../services/clients/api-client';

@Injectable({
  providedIn: 'root'
})
export class JudgeGuard implements CanActivate {

  constructor(
    private userProfileService: ProfileService,
    private router: Router) {
  }

  async canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Promise<boolean> {

    try {
      const profile = await this.userProfileService.getUserProfile();
      if (profile.role === UserRole.Judge) {
        return true;
      } else {
        this.router.navigate(['/home']);
        return false;
      }
    } catch (err) {
      console.error(`Could not get user identity.`);
      console.error(err);
      this.router.navigate(['/logout']);
      return false;
    }
  }
}
