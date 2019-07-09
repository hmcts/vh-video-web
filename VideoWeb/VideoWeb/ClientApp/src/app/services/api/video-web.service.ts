import { Injectable } from '@angular/core';
import {
  ApiClient, ConferenceForUserResponse, ConferenceResponse, ConferenceEventRequest,
  TaskResponse, AddMediaEventRequest, TestCallScoreResponse, TokenResponse,
  AddSelfTestFailureEventRequest,
  UpdateParticipantStatusEventRequest
} from '../clients/api-client';
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

  getConferencesToday(): Observable<ConferenceForUserResponse[]> {
    return this.apiClient.getConferencesToday();
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

  getTestCallScore(conferenceId: string, participantId: string): Observable<TestCallScoreResponse> {
    return this.apiClient.getTestCallResult(conferenceId, participantId);
  }

  getToken(participantId: string): Observable<TokenResponse> {
    return this.apiClient.getToken(participantId);
  }

  raiseSelfTestFailureEvent(conferenceId: string, addSelfTestFailureEventRequest: AddSelfTestFailureEventRequest): Observable<void> {
    return this.apiClient.addSelfTestFailureEventToConference(conferenceId, addSelfTestFailureEventRequest);
  }
}
