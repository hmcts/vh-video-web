import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
    ApiClient,
    ConferenceResponse,
    ConsultationAnswer,
    ConsultationRequest,
    ParticipantResponse,
    LeaveConsultationRequest,
    AdminConsultationRequest,
    RoomType
} from '../clients/api-client';

@Injectable({
    providedIn: 'root'
})
export class ConsultationService {
    constructor(private apiClient: ApiClient) {}

    raiseConsultationRequest(
        conference: ConferenceResponse,
        requester: ParticipantResponse,
        requestee: ParticipantResponse
    ): Observable<void> {
        return this.apiClient.handleConsultationRequest(
            new ConsultationRequest({
                conference_id: conference.id,
                requested_by: requester.id,
                requested_for: requestee.id
            })
        );
    }

    respondToConsultationRequest(
        conference: ConferenceResponse,
        requester: ParticipantResponse,
        requestee: ParticipantResponse,
        answer: ConsultationAnswer
    ): Observable<void> {
        return this.apiClient.handleConsultationRequest(
            new ConsultationRequest({
                conference_id: conference.id,
                requested_by: requester.id,
                requested_for: requestee.id,
                answer: answer
            })
        );
    }

    leaveConsultation(conference: ConferenceResponse, participant: ParticipantResponse): Observable<void> {
        return this.apiClient.leavePrivateConsultation(
            new LeaveConsultationRequest({
                conference_id: conference.id,
                participant_id: participant.id
            })
        );
    }

    respondToAdminConsultationRequest(
        conference: ConferenceResponse,
        participant: ParticipantResponse,
        answer: ConsultationAnswer,
        room: RoomType
    ): Observable<void> {
        return this.apiClient.respondToAdminConsultationRequest(
            new AdminConsultationRequest({
                conference_id: conference.id,
                participant_id: participant.id,
                answer: answer,
                consultation_room: room
            })
        );
    }
}
