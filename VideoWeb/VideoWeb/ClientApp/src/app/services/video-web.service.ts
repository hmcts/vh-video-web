import { Injectable } from '@angular/core';
import { ApiClient, ConferenceForUserResponse } from './clients/api-client';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class VideoWebService {

  constructor(private apiClient: ApiClient) {
  }
  getConferencesForUser(): Observable<ConferenceForUserResponse[]> {
    return this.apiClient.getConferencesForUser();
  }
}
