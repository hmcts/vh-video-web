import { Injectable } from '@angular/core';
import { ApiClient, UserProfileResponse } from '../clients/api-client';
import { Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ProfileService {

  profile: UserProfileResponse;

  constructor(private apiClient: ApiClient) { }

  getUserProfile(): Observable<UserProfileResponse> {
    if (this.profile) {
      return of(this.profile);
    }
    return this.apiClient.getUserProfile();
  }
}
