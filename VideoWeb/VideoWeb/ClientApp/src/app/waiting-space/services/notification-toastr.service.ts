import { Injectable } from '@angular/core';
import { Participant } from 'src/app/shared/models/participant';
import { Logger } from 'src/app/services/logging/logger-base';
import { ToastrService } from 'ngx-toastr';
import { VhToastComponent } from 'src/app/shared/toast/vh-toast.component';
import { ConsultationService } from 'src/app/services/api/consultation.service';
import { ConsultationAnswer } from 'src/app/services/clients/api-client';
import { NotificationSoundsService } from './notification-sounds.service';
import { Guid } from 'guid-typescript';
import { ParticipantHeartbeat } from '../../services/models/participant-heartbeat';

@Injectable()
export class NotificationToastrService {
    private readonly loggerPrefix = '[NotificationToastService] -';
    constructor(
        private logger: Logger,
        private toastr: ToastrService,
        private consultationService: ConsultationService,
        private notificationSoundService: NotificationSoundsService
    ) {
        this.notificationSoundService.initConsultationRequestRingtone();
    }

    activeRoomInviteRequests = [];
    activeHeartbeatReport = [];

    showConsultationInvite(
        roomLabel: string,
        conferenceId: string,
        requestedBy: Participant,
        requestedFor: Participant,
        participants: Participant[],
        inHearing: boolean
    ) {
        const inviteKey = `${conferenceId}_${roomLabel}`;
        if (this.activeRoomInviteRequests.indexOf(inviteKey) >= 0) {
            return;
        }
        this.activeRoomInviteRequests.push(inviteKey);
        this.logger.debug(`${this.loggerPrefix} creating 'showConsultationInvite' toastr notification`);
        if (!inHearing) {
            this.notificationSoundService.playConsultationRequestRingtone();
        }

        const requesterDisplayName = requestedBy === undefined || requestedBy === null ? `VHO` : requestedBy.displayName;
        const requestedById = requestedBy === undefined || requestedBy === null ? Guid.EMPTY : requestedBy.id;
        let message = `<span class="govuk-!-font-weight-bold">Call from ${requesterDisplayName}</span>`;
        const participantsList = participants
            .filter(p => p.id !== requestedById)
            .map(p => p.displayName)
            .join('<br/>');
        if (participantsList) {
            message += `<br/>with<br/>${participantsList}`;
        }

        const respondToConsultationRequest = async (answer: ConsultationAnswer) => {
            this.logger.info(`${this.loggerPrefix} Responding to consultation request with ${answer}`);

            const index = this.activeRoomInviteRequests.indexOf(inviteKey);
            this.activeRoomInviteRequests.splice(index, 1);

            await this.consultationService.respondToConsultationRequest(conferenceId, requestedById, requestedFor.id, answer, roomLabel);
        };

        const toast = this.toastr.show('', '', {
            timeOut: 120000,
            extendedTimeOut: 0,
            toastClass: 'vh-no-pointer',
            tapToDismiss: false,
            toastComponent: VhToastComponent
        });

        (toast.toastRef.componentInstance as VhToastComponent).vhToastOptions = {
            color: inHearing ? 'white' : 'black',
            htmlBody: message,
            onNoAction: async () => {
                respondToConsultationRequest(ConsultationAnswer.None);
                if (this.toastr.toasts.length === 1) {
                    this.notificationSoundService.stopConsultationRequestRingtone();
                }
            },
            buttons: [
                {
                    label: 'Accept',
                    hoverColour: 'green',
                    action: async () => {
                        respondToConsultationRequest(ConsultationAnswer.Accepted);
                        this.clearAllToastNotifications();
                    }
                },
                {
                    label: 'Decline',
                    hoverColour: 'red',
                    action: async () => {
                        respondToConsultationRequest(ConsultationAnswer.Rejected);
                        if (this.toastr.toasts.length === 1) {
                            this.notificationSoundService.stopConsultationRequestRingtone();
                        }
                    }
                }
            ]
        };
    }

    clearAllToastNotifications() {
        this.toastr.clear();
        this.notificationSoundService.stopConsultationRequestRingtone();
    }

    reportPoorConnection(heartbeat: ParticipantHeartbeat) {
        const heartbeatKey = `${heartbeat.participantId}_${heartbeat.heartbeatHealth.toString()}`;
        if (this.activeHeartbeatReport.indexOf(heartbeatKey) >= 0) {
            this.activeHeartbeatReport.push(heartbeatKey);
            if (this.activeHeartbeatReport.filter(x => x.indexOf(heartbeatKey) >= 0).length > 25) {
                this.activeHeartbeatReport = [];
            } else {
                return;
            }
        }

        this.activeHeartbeatReport.push(heartbeatKey);
        this.logger.debug(`${this.loggerPrefix} creating 'poor network connection' toastr notification`);

        let message = `<span class="govuk-!-font-weight-bold">Alert</span>`;
        message += `<br/>Your internet connection is poor. People may have trouble seeing and hearing you.<br/>`;
        const toast = this.toastr.show('', '', {
            timeOut: 120000,
            tapToDismiss: false,
            toastComponent: VhToastComponent
        });
        (toast.toastRef.componentInstance as VhToastComponent).vhToastOptions = {
            color: 'white',
            htmlBody: message,
            onNoAction: async () => {},
            buttons: [
                {
                    label: 'Dismiss',
                    hoverColour: 'green',
                    action: async () => {
                        this.toastr.remove(toast.toastId);
                    }
                }
            ]
        };
    }
}
