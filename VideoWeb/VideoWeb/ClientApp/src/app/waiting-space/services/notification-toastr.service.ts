import { Injectable } from '@angular/core';
import { Participant } from 'src/app/shared/models/participant';
import { Logger } from 'src/app/services/logging/logger-base';
import { ToastrService } from 'ngx-toastr';
import { VhToastComponent } from 'src/app/shared/toast/vh-toast.component';
import { ConsultationService } from 'src/app/services/api/consultation.service';
import { ConsultationAnswer } from 'src/app/services/clients/api-client';
import { NotificationSoundsService } from './notification-sounds.service';

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

    showConsultationInvite(
        roomLabel: string,
        conferenceId: string,
        requestedBy: Participant,
        requestedFor: Participant,
        participants: Participant[],
        inHearing: boolean
    ) {
        let inviteKey = `${conferenceId}_${roomLabel}`;
        if (this.activeRoomInviteRequests.indexOf(inviteKey) >= 0) {
            return;
        }
        this.activeRoomInviteRequests.push(inviteKey);
        this.logger.debug(`${this.loggerPrefix} creating 'showConsultationInvite' toastr notification`);
        if (!inHearing) {
            this.notificationSoundService.playConsultationRequestRingtone();
        }

        let message = `<span class="govuk-!-font-weight-bold">Call from ${requestedBy.displayName}</span>`;
        let participantsList = participants
            .filter(p => p.id !== requestedBy.id)
            .map(p => p.displayName)
            .join('<br/>');
        if (participantsList) {
            message += `<br/>with<br/>${participantsList}`;
        }

        let respondToConsultationRequest = async (answer: ConsultationAnswer) => {
            this.logger.info(`${this.loggerPrefix} Responding to consultation request with ${answer}`);

            let index = this.activeRoomInviteRequests.indexOf(inviteKey);
            this.activeRoomInviteRequests.splice(index, 1);

            await this.consultationService.respondToConsultationRequest(conferenceId, requestedBy.id, requestedFor.id, answer, roomLabel);
        };

        const toast = this.toastr.show('', '', {
            timeOut: 1200000,
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
}
