import { Injectable } from '@angular/core';
import { Participant } from 'src/app/shared/models/participant';
import { Logger } from 'src/app/services/logging/logger-base';
import { ToastrService } from 'ngx-toastr';
import { VhToastComponent } from 'src/app/shared/toast/vh-toast.component';
import { ConsultationService } from 'src/app/services/api/consultation.service';
import { ConsultationAnswer, ParticipantResponse, VideoEndpointResponse } from 'src/app/services/clients/api-client';
import { NotificationSoundsService } from './notification-sounds.service';
import { Guid } from 'guid-typescript';
import { ParticipantHeartbeat } from '../../services/models/participant-heartbeat';
import { TranslateService } from '@ngx-translate/core';
import { ConsultationInvitation } from './consultation-invitation.service';

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
    activeLinkedParticipantRejectionToasts: { [inviteKey: string]: VhToastComponent } = {};

    getInviteKey(conferenceId: string, roomLabel: string): string {
        return `${conferenceId}_${roomLabel}`;
    }

    showConsultationInvite(
        roomLabel: string,
        conferenceId: string,
        consultationInvitation: ConsultationInvitation,
        requestedBy: Participant,
        requestedFor: Participant,
        participants: Participant[],
        endpoints: VideoEndpointResponse[],
        inHearing: boolean
    ) {
        const inviteKey = this.getInviteKey(conferenceId, roomLabel);
        if (this.activeRoomInviteRequests.indexOf(inviteKey) >= 0) {
            return null;
        }
        this.activeRoomInviteRequests.push(inviteKey);
        this.logger.debug(`${this.loggerPrefix} creating 'showConsultationInvite' toastr notification`);
        if (!inHearing) {
            this.notificationSoundService.playConsultationRequestRingtone();
        }

        if (this.activeLinkedParticipantRejectionToasts[inviteKey]) {
            this.activeLinkedParticipantRejectionToasts[inviteKey].remove();
            delete this.activeLinkedParticipantRejectionToasts[inviteKey];
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

            await this.consultationService.respondToConsultationRequest(
                conferenceId,
                consultationInvitation.invitationId,
                requestedById,
                requestedFor.id,
                answer,
                roomLabel
            );
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
                await respondToConsultationRequest(ConsultationAnswer.Rejected);
            },
            onRemove: () => {
                const index = this.activeRoomInviteRequests.indexOf(inviteKey);
                this.activeRoomInviteRequests.splice(index, 1);

                if (!this.activeRoomInviteRequests.length) {
                    this.notificationSoundService.stopConsultationRequestRingtone();
                }
            },
            buttons: [
                {
                    label: this.translateService.instant('notification-toastr.invite.accept'),
                    hoverColour: 'green',
                    action: async () => {
                        await respondToConsultationRequest(ConsultationAnswer.Accepted);
                        this.toastr.remove(toast.toastId);
                    }
                },
                {
                    label: this.translateService.instant('notification-toastr.invite.decline'),
                    hoverColour: 'red',
                    action: async () => {
                        await respondToConsultationRequest(ConsultationAnswer.Rejected);
                        this.toastr.remove(toast.toastId);
                    }
                }
            ]
        };
        return toast.toastRef.componentInstance as VhToastComponent;
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
                    hoverColour: 'red',
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

    showParticipantAdded(participant: ParticipantResponse, inHearing: boolean = false): VhToastComponent {
        console.log('Faz', participant);
        let message = `<span class="govuk-!-font-weight-bold">${this.translateService.instant(
            'notification-toastr.participant-added.title',
            {
                name: participant.name
            }
        )}</span>`;
        message += `<br/>${this.translateService.instant('notification-toastr.participant-added.message', {
            role: this.translateHearingRole(participant.hearing_role),
            party: this.translateCaseRole(participant.case_type_group)
        })}<br/>`;

        const toast = this.toastr.show('', '', {
            timeOut: 0,
            tapToDismiss: false,
            toastComponent: VhToastComponent
        });
        (toast.toastRef.componentInstance as VhToastComponent).vhToastOptions = {
            color: inHearing ? 'white' : 'black',
            htmlBody: message,
            onNoAction: async () => {
                this.logger.info(`${this.loggerPrefix} No action called on participant added alert`);
            },
            buttons: [
                {
                    label: this.translateService.instant('notification-toastr.participant-added.dismiss'),
                    hoverColour: 'green',
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
