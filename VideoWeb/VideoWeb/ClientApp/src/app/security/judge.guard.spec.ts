import { TestBed, async, inject } from '@angular/core/testing';

import { JudgeGuard } from './judge.guard';
import { RouterTestingModule } from '@angular/router/testing';
import { SharedModule } from '../shared/shared.module';
import { ProfileService } from '../services/profile.service';
import { Router } from '@angular/router';
import { UserProfileResponse } from '../services/clients/api-client';
import { of, throwError } from 'rxjs';

describe('JudgeGuard', () => {
  let profileServiceSpy: jasmine.SpyObj<ProfileService>;
  let guard: JudgeGuard;
  const router = {
    navigate: jasmine.createSpy('navigate')
  };
  
  beforeEach(() => {
    profileServiceSpy = jasmine.createSpyObj<ProfileService>('ProfileService', ['getUserProfile']);
    TestBed.configureTestingModule({
      imports: [RouterTestingModule, SharedModule],
      providers: [
        JudgeGuard,
        { provide: Router, useValue: router },
        { provide: ProfileService, useValue: profileServiceSpy }
      ]
    });
    guard = TestBed.get(JudgeGuard);
  });

  it('should not be able to activate component if role is not Judge', async(async () => {
    const profile = new UserProfileResponse({ role: 'VHOfficer' });
    profileServiceSpy.getUserProfile.and.returnValue(of(profile));
    guard.canActivate(null, null).subscribe((result) => {
      expect(result).toBeFalsy();
      expect(router.navigate).toHaveBeenCalledWith(['/home']);
    });
  }));

  it('should be able to activate component if role is Judge', async(async () => {
    const profile = new UserProfileResponse({ role: 'Judge' });
    profileServiceSpy.getUserProfile.and.returnValue(of(profile));
    guard.canActivate(null, null).subscribe((result) => {
      expect(result).toBeTruthy();
    });
  }));

  it('should logout when user profile cannot be retrieved', async(async () => {
    profileServiceSpy.getUserProfile.and.returnValue(throwError({ status: 404 }));
    guard.canActivate(null, null).subscribe((result) => {
      expect(result).toBeFalsy();
      expect(router.navigate).toHaveBeenCalledWith(['/logout']);
    });
  }));
});
