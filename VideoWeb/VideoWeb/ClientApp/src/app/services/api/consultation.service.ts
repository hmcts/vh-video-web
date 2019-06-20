import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClient, ConferenceResponse, ConsultationAnswer, ConsultationRequest, ParticipantResponse } from '../clients/api-client';


@Injectable({
  providedIn: 'root'
})
export class ConsultationService {

  constructor(private apiClient: ApiClient) {
  }

  raiseConsultationRequest(conference: ConferenceResponse, requester: ParticipantResponse,
    requestee: ParticipantResponse): Observable<void> {
    return this.apiClient.handleConsultationRequest(new ConsultationRequest({
      conference_id: conference.id,
      requested_by: requester.id,
      requested_for: requestee.id
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
