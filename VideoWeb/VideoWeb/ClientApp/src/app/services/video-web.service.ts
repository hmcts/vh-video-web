import { Injectable } from '@angular/core';
import { ApiClient, ConferenceForUserResponse, ConferenceResponse } from './clients/api-client';
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

  getConferenceById(conferenceId: string): Observable<ConferenceResponse> {
    return this.apiClient.getConferenceById(conferenceId);
  }
}
