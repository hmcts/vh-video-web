import { Injectable } from '@angular/core';
import { ApiClient, ConferenceForUserResponse, ConferenceResponse, ConferenceEventRequest,
  TaskResponse, AddMediaEventRequest } from './clients/api-client';
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

  sendEvent(request: ConferenceEventRequest): Observable<void> {
    return this.apiClient.sendEvent(request);
  }

  raiseMediaEvent(conferenceId: string, addMediaEventRequest: AddMediaEventRequest): Observable<void> {
    return this.apiClient.addMediaEventToConference(conferenceId, addMediaEventRequest);
  }

  getTasksForConference(conferenceId: string): Observable<TaskResponse[]> {
    return this.apiClient.getTasks(conferenceId);
  }

  completeTask(conferenceId: string, taskId: number): Observable<TaskResponse> {
    return this.apiClient.completeTask(conferenceId, taskId);
  }
}
