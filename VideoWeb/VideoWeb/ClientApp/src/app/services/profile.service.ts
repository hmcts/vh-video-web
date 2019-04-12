import { Injectable } from '@angular/core';
import { ApiClient, UserProfileResponse } from './clients/api-client';
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

  loadProfile() {
    return new Promise((resolve, reject) => {
      this.getUserProfile().subscribe((data: UserProfileResponse) => {
        this.profile = data;
        resolve(true);
      }, err => resolve(err));
    });
  }
}
