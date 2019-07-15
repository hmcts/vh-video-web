import { Injectable } from '@angular/core';
import { ApiClient, UserProfileResponse } from '../clients/api-client';

@Injectable({
  providedIn: 'root'
})
export class ProfileService {

  profile: UserProfileResponse;

  constructor(private apiClient: ApiClient) { }

  async getUserProfile(): Promise<UserProfileResponse> {
    if (!this.profile) {
      this.profile = await this.apiClient.getUserProfile().toPromise();
    }
    return this.profile;
  }

  clearUserProfile(): void {
    this.profile = null;
  }
}
