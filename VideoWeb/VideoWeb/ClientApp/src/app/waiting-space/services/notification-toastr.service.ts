import { Injectable } from '@angular/core';
import { Logger } from 'src/app/services/logging/logger-base';
import { ToastrService } from 'ngx-toastr';
import { VhToastComponent } from 'src/app/shared/toast/vh-toast.component';
import { ParticipantResponse } from 'src/app/services/clients/api-client';
import { NotificationSoundsService } from './notification-sounds.service';
import { ParticipantHeartbeat } from '../../services/models/participant-heartbeat';
import { TranslateService } from '@ngx-translate/core';

@Injectable()
export class NotificationToastrService {
    private readonly loggerPrefix = '[NotificationToastService] -';
    constructor(
        private logger: Logger,
        private toastr: ToastrService,
        private notificationSoundService: NotificationSoundsService,
        private translateService: TranslateService
    ) {
        this.notificationSoundService.initConsultationRequestRingtone();
    }

    activeRoomInviteRequests = [];
    activeHeartbeatReport = [];
    activeLinkedParticipantRejectionToasts: { [inviteKey: string]: VhToastComponent } = {};

    getInviteKey(conferenceId: string, roomLabel: string): string {
        return `${conferenceId}_${roomLabel}`;
    }

    showConsultationRejectedByLinkedParticipant(
        conferenceId: string,
        roomLabel: string,
        rejectorName: string,
        invitedByName: string,
        inHearing: boolean
    ): VhToastComponent {
        const inviteKey = this.getInviteKey(conferenceId, roomLabel);
        if (this.activeLinkedParticipantRejectionToasts[inviteKey]) {
            this.activeLinkedParticipantRejectionToasts[inviteKey].remove();
            delete this.activeLinkedParticipantRejectionToasts[inviteKey];
        }

        const message = `<span class="govuk-!-font-weight-bold">${this.translateService.instant(
            'notification-toastr.linked-participants.rejected',
            {
                rejector: rejectorName,
                invitedBy: invitedByName
            }
        )}</span>`;

        this.activeLinkedParticipantRejectionToasts[inviteKey] = this.createConsultationNotificationToast(message, inHearing);
        return this.activeLinkedParticipantRejectionToasts[inviteKey];
    }

    showWaitingForLinkedParticipantsToAccept(
        linkedParticipantNames: string[],
        invitedByName: string,
        inHearing: boolean
    ): VhToastComponent {
        let message: string;
        if (linkedParticipantNames.length > 1) {
            message = `<span class="govuk-!-font-weight-bold">${this.translateService.instant(
                'notification-toastr.linked-participants.waiting-multiple',
                {
                    number: linkedParticipantNames.length,
                    invitedBy: invitedByName
                }
            )}</span>`;
        } else {
            message = `<span class="govuk-!-font-weight-bold">${this.translateService.instant(
                'notification-toastr.linked-participants.waiting-single',
                {
                    name: linkedParticipantNames[0],
                    invitedBy: invitedByName
                }
            )}</span>`;
        }

        return this.createConsultationNotificationToast(message, inHearing);
    }

    createConsultationNotificationToast(message: string, inHearing: boolean): VhToastComponent {
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
                this.toastr.remove(toast.toastId);
            },
            buttons: [
                {
                    label: this.translateService.instant('notification-toastr.linked-participants.button-close'),
                    setColour: 'red',
                    action: async () => {
                        this.toastr.remove(toast.toastId);
                    }
                }
            ]
        };

        return toast.toastRef.componentInstance as VhToastComponent;
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
            dismissOnly: true,
            htmlBody: message,
            onNoAction: async () => {
                this.logger.info(`${this.loggerPrefix} No action called on poor connection alert`);
            },
            buttons: [
                {
                    setColour: 'green',
                    label: this.translateService.instant('notification-toastr.poor-connection.dismiss'),
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
            dismissOnly: true,
            htmlBody: message,
            buttons: [
                {
                    setColour: 'green',
                    label: this.translateService.instant('notification-toastr.poor-connection.dismiss'),
                    action: async () => {
                        this.toastr.remove(toast.toastId);
                        callback();
                    }
                }
            ]
        };
        return toast.toastRef.componentInstance as VhToastComponent;
    }

    showParticipantAdded(participant: ParticipantResponse, inHearing: boolean = false): VhToastComponent {
        const showParty = !!participant.case_type_group;
        const messageBody = this.translateService.instant(
            showParty
                ? 'notification-toastr.participant-added.message-with-party'
                : 'notification-toastr.participant-added.message-without-party',
            {
                role: this.translateHearingRole(participant.hearing_role),
                party: showParty ? this.translateCaseRole(participant.case_type_group) : null
            }
        );

        let message = `<span class="govuk-!-font-weight-bold toast-content toast-header">${this.translateService.instant(
            'notification-toastr.participant-added.title',
            {
                name: participant.name
            }
        )}</span>`;
        message += `<span class="toast-content toast-body">${messageBody}</span>`;

        const toast = this.toastr.show('', '', {
            timeOut: 0,
            extendedTimeOut: 0,
            tapToDismiss: false,
            toastComponent: VhToastComponent
        });
        (toast.toastRef.componentInstance as VhToastComponent).vhToastOptions = {
            color: inHearing ? 'white' : 'black',
            dismissOnly: true,
            htmlBody: message,
            onNoAction: async () => {
                this.logger.info(`${this.loggerPrefix} No action called on participant added alert`);
            },
            buttons: [
                {
                    setColour: 'green',
                    label: this.translateService.instant('notification-toastr.participant-added.dismiss'),
                    action: async () => {
                        this.toastr.remove(toast.toastId);
                    }
                }
            ]
        };
        return toast.toastRef.componentInstance as VhToastComponent;
    }

    private translateHearingRole(hearingRole: string) {
        return this.translateService.instant('hearing-role.' + this.stringToTranslateId(hearingRole));
    }

    private translateCaseRole(caseTypeGroup: string) {
        return this.translateService.instant('case-type-group.' + this.stringToTranslateId(caseTypeGroup));
    }

    private stringToTranslateId(str: string) {
        return str?.replace(/\s/g, '-').toLowerCase();
    }
}
