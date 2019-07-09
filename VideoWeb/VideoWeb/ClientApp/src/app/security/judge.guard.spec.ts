import { async, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { of, throwError } from 'rxjs';

import { UserProfileResponse, UserRole } from '../services/clients/api-client';
import { ProfileService } from '../services/api/profile.service';
import { SharedModule } from '../shared/shared.module';
import { JudgeGuard } from './judge.guard';
import { Logger } from '../services/logging/logger-base';
import { MockLogger } from '../testing/mocks/MockLogger';

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
        { provide: ProfileService, useValue: profileServiceSpy },
        { provide: Logger, useClass: MockLogger }
      ]
    });
    guard = TestBed.get(JudgeGuard);
  });

  it('should not be able to activate component if role is not Judge', async(async () => {
    const profile = new UserProfileResponse({ role: UserRole.VideoHearingsOfficer });
    profileServiceSpy.getUserProfile.and.returnValue(of(profile));
    guard.canActivate(null, null).subscribe((result) => {
      expect(result).toBeFalsy();
      expect(router.navigate).toHaveBeenCalledWith(['/home']);
    });
  }));

  it('should be able to activate component if role is Judge', async(async () => {
    const profile = new UserProfileResponse({ role: UserRole.Judge });
    profileServiceSpy.getUserProfile.and.returnValue(of(profile));
    guard.canActivate(null, null).subscribe((result) => {
      expect(result).toBeTruthy();
    });
  }));

  it('should logout when user profile cannot be retrieved', async(async () => {
    profileServiceSpy.getUserProfile.and.returnValue(throwError({ status: 404, isApiException: true }));
    guard.canActivate(null, null).subscribe((result) => {
      expect(result).toBeFalsy();
      expect(router.navigate).toHaveBeenCalledWith(['/logout']);
    });
  }));
});
