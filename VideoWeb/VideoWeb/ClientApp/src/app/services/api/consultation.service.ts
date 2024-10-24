import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { NotificationSoundsService } from 'src/app/waiting-space/services/notification-sounds.service';
import {
    AddEndpointConsultationRequest,
    ApiClient,
    ConferenceResponse,
    ConsultationAnswer,
    InviteToConsultationRequest,
    JoinPrivateConsultationRequest,
    LeavePrivateConsultationRequest,
    LockConsultationRoomRequest,
    ParticipantResponse,
    PrivateConsultationRequest,
    StartPrivateConsultationRequest,
    VirtualCourtRoomType
} from '../clients/api-client';
import { Logger } from '../logging/logger-base';
import { ModalService } from '../modal.service';
import { Subject } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class ConsultationService {
    static readonly ERROR_PC_MODAL = 'pc-error-modal';
    static readonly LEAVE_PC_MODAL = 'pc-leave-modal';

    consultationError$ = new Subject<string>();

    constructor(
        private apiClient: ApiClient,
        private modalService: ModalService,
        private notificationSoundService: NotificationSoundsService,
        private logger: Logger,
        private translateService: TranslateService
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
        invitationId: string,
        requesterId: string,
        requesteeId: string,
        answer: ConsultationAnswer,
        roomLabel: string
    ): Promise<void> {
        this.logger.info('[ConsultationService] - Responding to consultation request', {
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
                        invitation_id: invitationId,
                        requested_by_id: requesterId,
                        requested_for_id: requesteeId,
                        answer: answer,
                        room_label: roomLabel
                    })
                )
                .toPromise();
        } catch (error) {
            this.displayConsultationErrorModal(error);
            this.logger.error('Failed to response to consultation request', error);
        }
    }

    async joinPrivateConsultationRoom(conferenceId: string, participantId: string, roomLabel: string) {
        try {
            this.clearModals();
            await this.apiClient
                .joinPrivateConsultation(
                    new JoinPrivateConsultationRequest({
                        conference_id: conferenceId,
                        participant_id: participantId,
                        room_label: roomLabel
                    })
                )
                .toPromise();
        } catch (error) {
            this.displayConsultationErrorModal(error);
            this.logger.error('Failed to join to consultation', error);
        }
    }

    async inviteToConsultation(conferenceId: string, roomLabel: string, requestParticipantId: string) {
        this.logger.info('[ConsultationService] - Inviting participant to this private consultation', {
            conferenceId: conferenceId,
            requestParticipantId: requestParticipantId,
            roomLabel: roomLabel
        });
        try {
            await this.apiClient
                .inviteToConsultation(
                    new InviteToConsultationRequest({
                        conference_id: conferenceId,
                        participant_id: requestParticipantId,
                        room_label: roomLabel
                    })
                )
                .toPromise();
        } catch (error) {
            this.displayConsultationErrorModal(error);
            throw error;
        }
    }

    async addEndpointToConsultation(conferenceId: string, roomLabel: string, endpointId: string) {
        this.logger.info('[ConsultationService] - Adding endpoint to this private consultation', {
            conferenceId: conferenceId,
            endpointId: endpointId,
            roomLabel: roomLabel
        });
        try {
            await this.apiClient
                .addEndpointToConsultation(
                    new AddEndpointConsultationRequest({
                        conference_id: conferenceId,
                        endpoint_id: endpointId,
                        room_label: roomLabel
                    })
                )
                .toPromise();
        } catch (error) {
            this.displayConsultationErrorModal(error);
            throw error;
        }
    }

    async joinJudicialConsultationRoom(conference: ConferenceResponse, participant: ParticipantResponse): Promise<void> {
        this.logger.info('[ConsultationService] - Attempting to join a private judicial consultation', {
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
            this.displayConsultationErrorModal(error);
            throw error;
        }
    }

    async createParticipantConsultationRoom(
        conference: ConferenceResponse,
        participant: ParticipantResponse,
        inviteParticipants: Array<string>,
        inviteEndpoints: Array<string>
    ): Promise<void> {
        this.logger.info('[ConsultationService] - Attempting to create a private consultation', {
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
                        invite_participants: inviteParticipants,
                        invite_endpoints: inviteEndpoints
                    })
                )
                .toPromise();
        } catch (error) {
            this.displayConsultationErrorModal(error);
            throw error;
        }
    }

    async leaveConsultation(conference: ConferenceResponse, participant: ParticipantResponse): Promise<void> {
        this.logger.info('[ConsultationService] - Leaving a consultation', {
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

    async lockConsultation(conferenceId: string, roomLabel: string, lock: boolean): Promise<void> {
        this.logger.info('[ConsultationService] - Setting consultation room lock state', {
            conference: conferenceId,
            roomLabel: roomLabel,
            lock: lock
        });
        await this.apiClient
            .lockConsultationRoomRequest(
                new LockConsultationRoomRequest({
                    conference_id: conferenceId,
                    room_label: roomLabel,
                    lock: lock
                })
            )
            .toPromise();
    }

    initCallRingingSound(): void {
        this.notificationSoundService.initConsultationRequestRingtone();
    }

    displayConsultationErrorModal(consultationError: string | Error) {
        this.logger.debug('[ConsultationService] - Displaying consultation error modal.');
        if (consultationError instanceof Error) {
            consultationError = consultationError?.message;
            this.consultationError$.next(consultationError);
        } else if (typeof consultationError === 'string') {
            this.consultationError$.next(consultationError);
        } else {
            this.consultationError$.next('');
        }
        this.displayModal(ConsultationService.ERROR_PC_MODAL);
    }

    displayConsultationLeaveModal() {
        this.logger.debug('[ConsultationService] - Displaying consultation leave modal.');
        this.displayModal(ConsultationService.LEAVE_PC_MODAL);
    }

    displayModal(modalId: string) {
        this.clearModals();
        this.modalService.open(modalId);
    }

    clearModals() {
        this.logger.debug('[ConsultationService] - Closing all modals.');
        this.modalService.closeAll();
    }

    consultationNameToString(roomLabel: string, shortName: boolean): string {
        const meetingRoom = this.translateService.instant(`consultation-service.meeting-room${shortName ? '-short' : ''}`) + ' ';
        const judgeRoom = this.translateService.instant(`consultation-service.judge-room${shortName ? '-short' : ''}`) + ' ';

        const roomName = roomLabel
            ?.replace('ParticipantConsultationRoom', meetingRoom)
            .replace('JudgeJOHConsultationRoom', judgeRoom)
            .replace('ConsultationRoom', meetingRoom);
        return roomName ?? meetingRoom.trimEnd();
    }
}
