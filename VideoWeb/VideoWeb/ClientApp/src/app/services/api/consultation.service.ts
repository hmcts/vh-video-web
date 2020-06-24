import { Injectable } from '@angular/core';
import { Participant } from 'src/app/shared/models/participant';
import { NotificationSoundsService } from 'src/app/waiting-space/services/notification-sounds.service';
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
import { Logger } from '../logging/logger-base';
import { ModalService } from '../modal.service';

@Injectable({
    providedIn: 'root'
})
export class ConsultationService {
    static REQUEST_PC_MODAL = 'raise-pc-modal';
    static RECEIVE_PC_MODAL = 'receive-pc-modal';
    static ACCEPTED_PC_MODAL = 'accepted-pc-modal';
    static REJECTED_PC_MODAL = 'rejected-pc-modal';
    static VHO_REQUEST_PC_MODAL = 'vho-raise-pc-modal';
    static NO_ROOM_PC_MODAL = 'no-room-pc-modal';
    static ERROR_PC_MODAL = 'pc-error-modal';

    callRingingTimeout: NodeJS.Timer;
    waitingForConsultationResponse: boolean;
    private readonly CALL_TIMEOUT = 120000;

    consultationRequestee: Participant;
    consultationRequester: Participant;

    constructor(
        private apiClient: ApiClient,
        private modalService: ModalService,
        private notificationSoundService: NotificationSoundsService,
        private logger: Logger
    ) {
        this.resetWaitingForResponse();
        this.initCallRingingSound();
    }

    resetWaitingForResponse() {
        this.waitingForConsultationResponse = false;
    }

    /**
     * Raise a private consulation request. Display a requesting PC modal and start call ringing.
     * @param conference conference
     * @param requester participant raising request
     * @param requestee participant user wishes to speak with
     */
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
        this.displayOutgoingPrivateConsultationRequestModal();
        this.startOutgoingCallRingingTimeout(conference, requester, requestee);
    }

    /**
     * Respond to a private consultation between participants
     * @param conference conference
     * @param requester participant raising request
     * @param requestee participant user wishes to speak with
     * @param answer the response to a consultation request
     */
    async respondToConsultationRequest(
        conference: ConferenceResponse,
        requester: ParticipantResponse,
        requestee: ParticipantResponse,
        answer: ConsultationAnswer
    ): Promise<void> {
        this.waitingForConsultationResponse = false;
        await this.handleConsultationRequest(
            new PrivateConsultationRequest({
                conference_id: conference.id,
                requested_by_id: requester.id,
                requested_for_id: requestee.id,
                answer: answer
            })
        );
    }

    /**
     * Raise or respond to a consultation request. Clears any ringing or modals first.
     * Displays "No Rooms Available" modal when attempting to raise or respond to a private consultation when no room is available.
     * Displays an "Error" modal when there is a problem witht the request, informing the user to try again later.
     * @param request request to process
     */
    private async handleConsultationRequest(request: PrivateConsultationRequest): Promise<void> {
        try {
            this.stopCallRinging();
            this.clearModals();
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

    /**
     * Display the appropriate modal to a requester once a requestee has responded
     * @param answer response to a consultation request
     */
    handleConsultationResponse(answer: ConsultationAnswer) {
        this.stopCallRinging();
        switch (answer) {
            case ConsultationAnswer.Accepted:
                this.displayModal(ConsultationService.ACCEPTED_PC_MODAL);
                break;
            case ConsultationAnswer.Rejected:
                this.displayModal(ConsultationService.REJECTED_PC_MODAL);
                break;
            default:
                this.clearModals();
                break;
        }
    }

    /**
     * Leave a private consultation
     * @param conference conference
     * @param participant participant attempting to leave a private consultation
     */
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

    /**
     * Responsd to a consultation with a VH Officer
     * @param conference conference
     * @param participant participant admin wishes to speak with
     * @param answer the response to a private consultation with an admin
     * @param room the room they wish to be transferred to
     */
    async respondToAdminConsultationRequest(
        conference: ConferenceResponse,
        participant: ParticipantResponse,
        answer: ConsultationAnswer,
        room: RoomType
    ): Promise<void> {
        this.waitingForConsultationResponse = false;
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
        this.stopCallRinging();
    }

    displayOutgoingPrivateConsultationRequestModal() {
        this.displayModal(ConsultationService.REQUEST_PC_MODAL);
    }

    displayIncomingPrivateConsultation() {
        this.displayModal(ConsultationService.RECEIVE_PC_MODAL);
        this.startIncomingCallRingingTimeout();
    }

    displayAdminConsultationRequest() {
        this.displayModal(ConsultationService.VHO_REQUEST_PC_MODAL);
        this.startIncomingCallRingingTimeout();
    }

    displayNoConsultationRoomAvailableModal() {
        this.displayModal(ConsultationService.NO_ROOM_PC_MODAL);
    }

    displayConsultationErrorModal() {
        this.displayModal(ConsultationService.ERROR_PC_MODAL);
    }

    displayConsultationRejectedModal() {
        this.displayModal(ConsultationService.REJECTED_PC_MODAL);
    }

    clearModals() {
        this.modalService.closeAll();
    }

    displayModal(modalId: string) {
        this.clearModals();
        this.modalService.open(modalId);
    }

    initCallRingingSound(): void {
        this.notificationSoundService.initConsultationRequestRingtone();
    }

    /**
     * Begin a timer which starting the call ringing but automatically cancels after a period of no response
     * @param conference conference
     * @param requester participant raising request
     * @param requestee participant user wishes to speak with
     */
    async startOutgoingCallRingingTimeout(conference: ConferenceResponse, requester: ParticipantResponse, requestee: ParticipantResponse) {
        this.waitingForConsultationResponse = true;
        this.callRingingTimeout = setTimeout(async () => {
            await this.cancelTimedOutConsultationRequest(conference, requester, requestee);
        }, this.CALL_TIMEOUT);
        this.notificationSoundService.playConsultationRequestRingtone();
    }

    /**
     * Begin a timer which starting the call ringing but automatically cancels after a period of no response
     */
    async startIncomingCallRingingTimeout() {
        this.callRingingTimeout = setTimeout(() => {
            this.cancelTimedOutIncomingRequest();
        }, this.CALL_TIMEOUT);
        this.notificationSoundService.playConsultationRequestRingtone();
    }

    cancelTimedOutIncomingRequest() {
        this.stopCallRinging();
        this.clearModals();
    }

    async cancelTimedOutConsultationRequest(
        conference: ConferenceResponse,
        requester: ParticipantResponse,
        requestee: ParticipantResponse
    ) {
        if (!this.waitingForConsultationResponse) {
            return;
        }
        this.waitingForConsultationResponse = false;
        this.logger.info('Consultation request timed-out. Cancelling call');
        await this.respondToConsultationRequest(conference, requester, requestee, ConsultationAnswer.Cancelled);
        this.displayConsultationRejectedModal();
    }

    async cancelConsultationRequest(conference: ConferenceResponse, requester: ParticipantResponse, requestee: ParticipantResponse) {
        this.stopCallRinging();
        await this.respondToConsultationRequest(conference, requester, requestee, ConsultationAnswer.Cancelled);
        this.clearModals();
    }

    stopCallRinging() {
        this.clearOutoingCallTimeout();
        this.notificationSoundService.stopConsultationRequestRingtone();
    }

    clearOutoingCallTimeout() {
        if (this.callRingingTimeout) {
            clearTimeout(this.callRingingTimeout);
            this.callRingingTimeout = null;
        }
    }
}
