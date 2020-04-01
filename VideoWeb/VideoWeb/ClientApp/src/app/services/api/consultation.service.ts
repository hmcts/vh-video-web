import { Injectable } from '@angular/core';
import {
    AdminConsultationRequest,
    ApiClient,
    ConferenceResponse,
    ConsultationAnswer,
    ConsultationRequest,
    LeaveConsultationRequest,
    ParticipantResponse,
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
    ): Promise<void> {
        return this.apiClient
            .handleConsultationRequest(
                new ConsultationRequest({
                    conference_id: conference.id,
                    requested_by: requester.id,
                    requested_for: requestee.id
                })
            )
            .toPromise();
    }

    respondToConsultationRequest(
        conference: ConferenceResponse,
        requester: ParticipantResponse,
        requestee: ParticipantResponse,
        answer: ConsultationAnswer
    ): Promise<void> {
        return this.apiClient
            .handleConsultationRequest(
                new ConsultationRequest({
                    conference_id: conference.id,
                    requested_by: requester.id,
                    requested_for: requestee.id,
                    answer: answer
                })
            )
            .toPromise();
    }

    leaveConsultation(conference: ConferenceResponse, participant: ParticipantResponse): Promise<void> {
        return this.apiClient
            .leavePrivateConsultation(
                new LeaveConsultationRequest({
                    conference_id: conference.id,
                    participant_id: participant.id
                })
            )
            .toPromise();
    }

    respondToAdminConsultationRequest(
        conference: ConferenceResponse,
        participant: ParticipantResponse,
        answer: ConsultationAnswer,
        room: RoomType
    ): Promise<void> {
        return this.apiClient
            .respondToAdminConsultationRequest(
                new AdminConsultationRequest({
                    conference_id: conference.id,
                    participant_id: participant.id,
                    answer: answer,
                    consultation_room: room
                })
            )
            .toPromise();
    }
}
