import { Injectable } from '@angular/core';
import { NotificationSoundsService } from 'src/app/waiting-space/services/notification-sounds.service';
import {
    ApiClient,
    ConferenceResponse,
    ConsultationAnswer,
    LeavePrivateConsultationRequest,
    ParticipantResponse,
    PrivateConsultationRequest,
    PrivateVideoEndpointConsultationRequest,
    StartPrivateConsultationRequest,
    VideoEndpointResponse,
    VirtualCourtRoomType
} from '../clients/api-client';
import { Logger } from '../logging/logger-base';
import { ModalService } from '../modal.service';

@Injectable({
    providedIn: 'root'
})
export class ConsultationService {
    static ERROR_PC_MODAL = 'pc-error-modal';

    constructor(
        private apiClient: ApiClient,
        private modalService: ModalService,
        private notificationSoundService: NotificationSoundsService,
        private logger: Logger
    ) {
        this.initCallRingingSound();
    }

    /**
     * Respond to a private consultation between participants
     * @param conference conference
     * @param requester participant raising request
     * @param requestee participant user wishes to speak with
     * @param answer the response to a consultation request
     */
    async respondToConsultationRequest(
        conferenceId: string,
        requesterId: string,
        requesteeId: string,
        answer: ConsultationAnswer,
        roomLabel: string
    ): Promise<void> {
        this.logger.info(`[ConsultationService] - Responding to consultation request`, {
            conference: conferenceId,
            requester: requesterId,
            requestee: requesteeId,
            answer: answer,
            room_label: roomLabel
        });

        try {
            this.clearModals();
            await this.apiClient
                .respondToConsultationRequest(
                    new PrivateConsultationRequest({
                        conference_id: conferenceId,
                        requested_by_id: requesterId,
                        requested_for_id: requesteeId,
                        answer: answer,
                        room_label: roomLabel
                    })
                )
                .toPromise();
        } catch (error) {
            this.displayConsultationErrorModal();
            this.logger.error(`Failed to response to consultation request`, error);
        }
    }

    /**
     * Start a private consultation with video endpoint. This will only be allowed for defence advocates linked to the
     * endpoint
     * @param conference conference
     * @param endpoint video endpoint to call
     */
    async startPrivateConsulationWithEndpoint(conference: ConferenceResponse, endpoint: VideoEndpointResponse) {
        this.logger.info(`[ConsultationService] - Starting a private consultation with a video endpoint`, {
            conference: conference.id,
            endpoint: endpoint.id
        });
        try {
            this.clearModals();
            await this.apiClient
                .callVideoEndpoint(
                    new PrivateVideoEndpointConsultationRequest({
                        conference_id: conference.id,
                        endpoint_id: endpoint.id
                    })
                )
                .toPromise();
        } catch (error) {
            this.displayConsultationErrorModal();
            throw error;
        }
    }

    async joinJudicialConsultationRoom(conference: ConferenceResponse, participant: ParticipantResponse): Promise<void> {
        this.logger.info(`[ConsultationService] - Attempting to join a private judicial consultation`, {
            conference: conference.id,
            participant: participant.id
        });
        try {
            await this.apiClient
                .startOrJoinConsultation(
                    new StartPrivateConsultationRequest({
                        conference_id: conference.id,
                        requested_by: participant.id,
                        room_type: VirtualCourtRoomType.JudgeJOH
                    })
                )
                .toPromise();
        } catch (error) {
            this.displayConsultationErrorModal();
            throw error;
        }
    }

    async createParticipantConsultationRoom(
        conference: ConferenceResponse,
        participant: ParticipantResponse,
        inviteParticipants: Array<string>
    ): Promise<void> {
        this.logger.info(`[ConsultationService] - Attempting to create a private consultation`, {
            conference: conference.id,
            participant: participant.id
        });
        try {
            await this.apiClient
                .startOrJoinConsultation(
                    new StartPrivateConsultationRequest({
                        conference_id: conference.id,
                        requested_by: participant.id,
                        room_type: VirtualCourtRoomType.Participant,
                        invite_participants: inviteParticipants
                    })
                )
                .toPromise();
        } catch (error) {
            this.displayConsultationErrorModal();
            throw error;
        }
    }

    async leaveConsultation(conference: ConferenceResponse, participant: ParticipantResponse): Promise<void> {
        this.logger.info(`[ConsultationService] - Leaving a consultation`, {
            conference: conference.id,
            participant: participant.id
        });
        await this.apiClient
            .leaveConsultation(
                new LeavePrivateConsultationRequest({
                    conference_id: conference.id,
                    participant_id: participant.id
                })
            )
            .toPromise();
    }

    initCallRingingSound(): void {
        this.notificationSoundService.initConsultationRequestRingtone();
    }

    displayConsultationErrorModal() {
        this.logger.debug('[ConsultationService] - Displaying consultation error modal.');
        this.displayModal(ConsultationService.ERROR_PC_MODAL);
    }

    displayModal(modalId: string) {
        this.clearModals();
        this.modalService.open(modalId);
    }

    clearModals() {
        this.logger.debug('[ConsultationService] - Closing all modals.');
        this.modalService.closeAll();
    }
}
