import { Injectable } from '@angular/core';
import { Participant } from 'src/app/shared/models/participant';
import { Logger } from 'src/app/services/logging/logger-base';
import { ToastrService } from 'ngx-toastr';
import { VhToastComponent } from 'src/app/shared/toast/vh-toast.component';
import { ConsultationService } from 'src/app/services/api/consultation.service';
import { ConsultationAnswer, VideoEndpointResponse } from 'src/app/services/clients/api-client';
import { NotificationSoundsService } from './notification-sounds.service';
import { Guid } from 'guid-typescript';
import { ParticipantHeartbeat } from '../../services/models/participant-heartbeat';
import { TranslateService } from '@ngx-translate/core';

@Injectable()
export class NotificationToastrService {
    private readonly loggerPrefix = '[NotificationToastService] -';
    constructor(
        private logger: Logger,
        private toastr: ToastrService,
        private consultationService: ConsultationService,
        private notificationSoundService: NotificationSoundsService,
        private translateService: TranslateService
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
        endpoints: VideoEndpointResponse[],
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

        const requesterDisplayName =
            requestedBy === undefined || requestedBy === null
                ? this.translateService.instant('notification-toastr.invite.video-hearing-officer')
                : requestedBy.displayName;
        const requestedById = requestedBy === undefined || requestedBy === null ? Guid.EMPTY : requestedBy.id;
        let message = `<span class="govuk-!-font-weight-bold">${this.translateService.instant('notification-toastr.invite.call-from', {
            name: requesterDisplayName
        })}</span>`;
        const participantsList = participants
            .filter(p => p.id !== requestedById)
            .map(p => p.displayName)
            .join('<br/>');
        const endpointsList = endpoints
            .filter(p => p.id !== requestedById)
            .map(p => p.display_name)
            .join('<br/>');
        if (participantsList || endpointsList) {
            message += '<br/>' + this.translateService.instant('notification-toastr.invite.with');
        }
        if (participantsList) {
            message += `<br/>${participantsList}`;
        }
        if (endpointsList) {
            message += `<br/>${endpointsList}`;
        }

        const respondToConsultationRequest = async (answer: ConsultationAnswer) => {
            this.logger.info(
                `${this.loggerPrefix} Responding to consultation request with conference id ${conferenceId} request by id ${requestedById} answer ${answer} room label ${roomLabel}`
            );

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
                    label: this.translateService.instant('notification-toastr.invite.accept'),
                    hoverColour: 'green',
                    action: async () => {
                        respondToConsultationRequest(ConsultationAnswer.Accepted);
                        this.clearAllToastNotifications();
                    }
                },
                {
                    label: this.translateService.instant('notification-toastr.invite.decline'),
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
        return toast.toastRef.componentInstance as VhToastComponent;
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

        let message = `<span class="govuk-!-font-weight-bold">${this.translateService.instant(
            'notification-toastr.poor-connection.title'
        )}</span>`;
        message += `<br/>${this.translateService.instant('notification-toastr.poor-connection.message')}<br/>`;
        const toast = this.toastr.show('', '', {
            timeOut: 120000,
            tapToDismiss: false,
            toastComponent: VhToastComponent
        });
        (toast.toastRef.componentInstance as VhToastComponent).vhToastOptions = {
            color: 'white',
            htmlBody: message,
            onNoAction: async () => {
                this.logger.info(`${this.loggerPrefix} No action called on poor connection alert`);
            },
            buttons: [
                {
                    label: this.translateService.instant('notification-toastr.poor-connection.dismiss'),
                    hoverColour: 'green',
                    action: async () => {
                        this.toastr.remove(toast.toastId);
                    }
                }
            ]
        };
    }

    showAudioRecordingError(callback: Function) {
        this.logger.debug(`${this.loggerPrefix} creating 'audio recording error' toastr notification`);

        let message = `<span class="govuk-!-font-weight-bold">${this.translateService.instant('audio-alert.title')}</span>`;
        message += `<br/>${this.translateService.instant('audio-alert.message')}<br/>`;
        const toast = this.toastr.show('', '', {
            tapToDismiss: false,
            toastComponent: VhToastComponent
        });
        (toast.toastRef.componentInstance as VhToastComponent).vhToastOptions = {
            color: 'white',
            htmlBody: message,
            buttons: [
                {
                    label: this.translateService.instant('notification-toastr.poor-connection.dismiss'),
                    hoverColour: 'green',
                    action: async () => {
                        this.toastr.remove(toast.toastId);
                        callback();
                    }
                }
            ]
        };
        return toast.toastRef.componentInstance as VhToastComponent;
    }
}
