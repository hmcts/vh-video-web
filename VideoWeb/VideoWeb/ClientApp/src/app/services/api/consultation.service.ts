import { Injectable } from '@angular/core';
import {
    ApiClient,
    BadRequestModelResponse,
    ConferenceResponse,
    ConsultationAnswer,
    LeavePrivateConsultationRequest,
    ParticipantResponse,
    PrivateAdminConsultationRequest,
    PrivateConsultationRequest,
    RoomType
} from '../clients/api-client';
import { ModalService } from '../modal.service';

@Injectable({
    providedIn: 'root'
})
export class ConsultationService {
    static NO_ROOM_PC_MODAL = 'no-room-pc-modal';
    static ERROR_PC_MODAL = 'pc-error-modal';

    constructor(private apiClient: ApiClient, private modalService: ModalService) {}

    async raiseConsultationRequest(
        conference: ConferenceResponse,
        requester: ParticipantResponse,
        requestee: ParticipantResponse
    ): Promise<void> {
        await this.handleConsultationRequest(
            new PrivateConsultationRequest({
                conference_id: conference.id,
                requested_by_id: requester.id,
                requested_for_id: requestee.id
            })
        );
    }

    async respondToConsultationRequest(
        conference: ConferenceResponse,
        requester: ParticipantResponse,
        requestee: ParticipantResponse,
        answer: ConsultationAnswer
    ): Promise<void> {
        await this.handleConsultationRequest(
            new PrivateConsultationRequest({
                conference_id: conference.id,
                requested_by_id: requester.id,
                requested_for_id: requestee.id,
                answer: answer
            })
        );
    }

    private async handleConsultationRequest(request: PrivateConsultationRequest): Promise<void> {
        try {
            await this.apiClient.handleConsultationRequest(request).toPromise();
        } catch (error) {
            if (this.checkNoRoomsLeftError(error)) {
                this.displayNoConsultationRoomAvailableModal();
            } else {
                this.displayConsultationErrorModal();
                throw error;
            }
        }
    }

    private checkNoRoomsLeftError(error: any): boolean {
        if (!(error instanceof BadRequestModelResponse)) {
            return false;
        }
        return error.errors && error.errors.findIndex(x => x.errors.includes('No consultation room available')) >= 0;
    }

    async leaveConsultation(conference: ConferenceResponse, participant: ParticipantResponse): Promise<void> {
        await this.apiClient
            .leavePrivateConsultation(
                new LeavePrivateConsultationRequest({
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
                new PrivateAdminConsultationRequest({
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

    displayConsultationErrorModal() {
        this.clearModals();
        this.modalService.open(ConsultationService.ERROR_PC_MODAL);
    }

    clearModals() {
        this.modalService.closeAll();
    }
}
