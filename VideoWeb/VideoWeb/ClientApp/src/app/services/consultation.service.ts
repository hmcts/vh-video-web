import { Injectable } from '@angular/core';
import { ApiClient, ConsultationRequest, ParticipantResponse, ConsultationAnswer, ConferenceResponse } from './clients/api-client';
import { Observable } from 'rxjs';


@Injectable({
  providedIn: 'root'
})
export class ConsultationService {

  constructor(private apiClient: ApiClient) {
  }

  raiseConsultationRequest(conference: ConferenceResponse, requester: ParticipantResponse,
    requestee: ParticipantResponse): Observable<void> {
    return this.apiClient.handleConsultationRequest(new ConsultationRequest({
      requested_by: requester.id,
      requested_for: requestee.id,
      conference_id: conference.id
    }));
  }

  respondToConsultationRequest(conference: ConferenceResponse, requester: ParticipantResponse,
    requestee: ParticipantResponse, answer: ConsultationAnswer) {
    return this.apiClient.handleConsultationRequest(new ConsultationRequest({
      conference_id: conference.id,
      requested_by: requester.id,
      requested_for: requestee.id,
      answer: answer
    }));
  }
}
