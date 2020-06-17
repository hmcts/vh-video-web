import { Injectable } from '@angular/core';
import {
    AdminConsultationRequest,
    ApiClient,
    BadRequestModelResponse,
    ConferenceResponse,
    ConsultationAnswer,
    ConsultationRequest,
    LeaveConsultationRequest,
    ParticipantResponse,
    RoomType
} from '../clients/api-client';
import { ModalService } from '../modal.service';

@Injectable({
    providedIn: 'root'
})
export class ConsultationService {
    static NO_ROOM_PC_MODAL = 'no-room-pc-modal';

    constructor(private apiClient: ApiClient, private modalService: ModalService) {}

    async raiseConsultationRequest(
        conference: ConferenceResponse,
        requester: ParticipantResponse,
        requestee: ParticipantResponse
    ): Promise<void> {
        await this.apiClient
            .handleConsultationRequest(
                new ConsultationRequest({
                    conference_id: conference.id,
                    requested_by: requester.id,
                    requested_for: requestee.id
                })
            )
            .toPromise();
    }

    async respondToConsultationRequest(
        conference: ConferenceResponse,
        requester: ParticipantResponse,
        requestee: ParticipantResponse,
        answer: ConsultationAnswer
    ): Promise<void> {
        try {
            await this.apiClient
                .handleConsultationRequest(
                    new ConsultationRequest({
                        conference_id: conference.id,
                        requested_by: requester.id,
                        requested_for: requestee.id,
                        answer: answer
                    })
                )
                .toPromise();
        } catch (error) {
            if (this.checkNoRoomsLeftError(error)) {
                this.displayNoConsultationRoomAvailableModal();
            } else {
                throw error;
            }
        }
    }

    private checkNoRoomsLeftError(error: any): boolean {
        if (!(error instanceof BadRequestModelResponse)) {
            return false;
        }
        return error.errors.findIndex(x => x.errors.includes('No consultation room available')) >= 0;
    }

    async leaveConsultation(conference: ConferenceResponse, participant: ParticipantResponse): Promise<void> {
        await this.apiClient
            .leavePrivateConsultation(
                new LeaveConsultationRequest({
                    conference_id: conference.id,
                    participant_id: participant.id
                })
            )
            .toPromise();
    }

    async respondToAdminConsultationRequest(
        conference: ConferenceResponse,
        participant: ParticipantResponse,
        answer: ConsultationAnswer,
        room: RoomType
    ): Promise<void> {
        await this.apiClient
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

    displayNoConsultationRoomAvailableModal() {
        this.clearModals();
        this.modalService.open(ConsultationService.NO_ROOM_PC_MODAL);
    }

    clearModals() {
        this.modalService.closeAll();
    }
}
