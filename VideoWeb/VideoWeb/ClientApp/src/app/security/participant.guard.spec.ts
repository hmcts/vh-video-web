import { TestBed, async, inject } from '@angular/core/testing';

import { ParticipantGuard } from './participant.guard';
import { RouterTestingModule } from '@angular/router/testing';
import { SharedModule } from '../shared/shared.module';
import { ProfileService } from '../services/api/profile.service';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { UserProfileResponse, UserRole } from '../services/clients/api-client';

describe('ParticipantGuard', () => {
  let profileServiceSpy: jasmine.SpyObj<ProfileService>;
  let guard: ParticipantGuard;
  const router = {
    navigate: jasmine.createSpy('navigate')
  };

  beforeEach(() => {
    profileServiceSpy = jasmine.createSpyObj<ProfileService>('ProfileService', ['getUserProfile']);
    TestBed.configureTestingModule({
      imports: [RouterTestingModule, SharedModule],
      providers: [
        ParticipantGuard,
        { provide: Router, useValue: router },
        { provide: ProfileService, useValue: profileServiceSpy }
      ]
    });
    guard = TestBed.get(ParticipantGuard);
  });

  it('should not be able to activate component if role is VHOfficer', async(async () => {
    const profile = new UserProfileResponse({ role: UserRole.VideoHearingsOfficer });
    profileServiceSpy.getUserProfile.and.returnValue(of(profile));
    guard.canActivate(null, null).subscribe((result) => {
      expect(result).toBeFalsy();
      expect(router.navigate).toHaveBeenCalledWith(['/home']);
    });
  }));

  it('should not be able to activate component if role is Judge', async(async () => {
    const profile = new UserProfileResponse({ role: UserRole.Judge });
    profileServiceSpy.getUserProfile.and.returnValue(of(profile));
    guard.canActivate(null, null).subscribe((result) => {
      expect(result).toBeFalsy();
      expect(router.navigate).toHaveBeenCalledWith(['/home']);
    });
  }));

  it('should not be able to activate component if role is Case Admin', async(async () => {
    const profile = new UserProfileResponse({ role: UserRole.CaseAdmin });
    profileServiceSpy.getUserProfile.and.returnValue(of(profile));
    guard.canActivate(null, null).subscribe((result) => {
      expect(result).toBeFalsy();
      expect(router.navigate).toHaveBeenCalledWith(['/home']);
    });
  }));

  it('should be able to activate component if role is Individual', async(async () => {
    const profile = new UserProfileResponse({ role: UserRole.Individual });
    profileServiceSpy.getUserProfile.and.returnValue(of(profile));
    guard.canActivate(null, null).subscribe((result) => {
      expect(result).toBeTruthy();
    });
  }));

  it('should be able to activate component if role is Representative', async(async () => {
    const profile = new UserProfileResponse({ role: UserRole.Representative });
    profileServiceSpy.getUserProfile.and.returnValue(of(profile));
    guard.canActivate(null, null).subscribe((result) => {
      expect(result).toBeTruthy();
    });
  }));

  it('should logout when user profile cannot be retrieved', async(async () => {
    profileServiceSpy.getUserProfile.and.returnValue(throwError({ status: 404, isSwaggerException: true }));
    guard.canActivate(null, null).subscribe((result) => {
      expect(result).toBeFalsy();
      expect(router.navigate).toHaveBeenCalledWith(['/logout']);
    });
  }));
});
