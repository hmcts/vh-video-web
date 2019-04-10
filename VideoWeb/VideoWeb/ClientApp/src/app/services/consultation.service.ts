import { Injectable } from '@angular/core';
import {
  ApiClient, PrivateConsultationRequest, ParticipantResponse,
  ConsultationRequestAnswer, PrivateConsultationAnswerRequest, ConferenceResponse
} from './clients/api-client';
import { Observable } from 'rxjs';


@Injectable({
  providedIn: 'root'
})
export class ConsultationService {

  constructor(private apiClient: ApiClient) {
  }

  raiseConsultationRequest(conference: ConferenceResponse, requester: ParticipantResponse,
    requestee: ParticipantResponse): Observable<void> {
    return this.apiClient.requestConsultation(new PrivateConsultationRequest({
      request_by: requester.id,
      request_for: requestee.id,
      conference_id: conference.id
    }));
  }

  respondToConsultationRequest(conference: ConferenceResponse, requester: ParticipantResponse,
    requestee: ParticipantResponse, answer: ConsultationRequestAnswer) {
    return this.apiClient.respondToConsultationRequest(new PrivateConsultationAnswerRequest({
      request_by: requester.id,
      request_for: requestee.id,
      conference_id: conference.id,
      answer: answer
    }));
  }
}
