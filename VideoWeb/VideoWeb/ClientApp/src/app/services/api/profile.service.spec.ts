import { TestBed, inject } from '@angular/core/testing';

import { ProfileService } from './profile.service';
import { SharedModule } from '../../shared/shared.module';
import { UserProfileResponse, UserRole, ApiClient } from '../clients/api-client';
import { of } from 'rxjs';

describe('ProfileService', () => {
  let apiClient: ApiClient;
  const knownProfile = new UserProfileResponse({
    role: UserRole.Individual,
    display_name: 'John Doe',
    first_name: 'John',
    last_name: 'Doe'
  });

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [SharedModule],
      providers: [ProfileService]
    });

    apiClient = TestBed.get(ApiClient);
    spyOn(apiClient, 'getUserProfile').and.returnValue(of(knownProfile));
  });

  it('should not call api when profile is already set', inject([ProfileService], async (service: ProfileService) => {
    service.profile = knownProfile;
    const result = await service.getUserProfile();
    expect(result).toBe(knownProfile);
    expect(apiClient.getUserProfile).toHaveBeenCalledTimes(0);
  }));

  it('should call api when profile is not set', inject([ProfileService], async (service: ProfileService) => {
    service.profile = null;
    const result = await service.getUserProfile();
    expect(result).toBe(knownProfile);
    expect(apiClient.getUserProfile).toHaveBeenCalledTimes(1);
  }));
});
