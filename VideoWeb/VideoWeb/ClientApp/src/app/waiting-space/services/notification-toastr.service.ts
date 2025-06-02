import { Injectable } from '@angular/core';
import { Logger } from 'src/app/services/logging/logger-base';
import { ToastrService } from 'ngx-toastr';
import { VhToastComponent } from 'src/app/shared/toast/vh-toast.component';
import { ConsultationService } from 'src/app/services/api/consultation.service';
import { ConsultationAnswer, Role } from 'src/app/services/clients/api-client';
import { NotificationSoundsService } from './notification-sounds.service';
import { Guid } from 'guid-typescript';
import { ParticipantHeartbeat } from '../../services/models/participant-heartbeat';
import { TranslateService } from '@ngx-translate/core';
import { ConsultationInvitation } from './consultation-invitation.service';
import { VHEndpoint, VHParticipant } from '../store/models/vh-conference';
import { UpdatedAllocation } from 'src/app/shared/models/update-allocation-dto';
import { ConferenceState } from '../store/reducers/conference.reducer';
import { Store } from '@ngrx/store';
import { VideoCallHostActions } from '../store/actions/video-call-host.actions';

@Injectable()
export class NotificationToastrService {
    activeRoomInviteRequests = [];
    activeHeartbeatReport = [];
    activeLinkedParticipantRejectionToasts: { [inviteKey: string]: VhToastComponent } = {};

    private readonly loggerPrefix = '[NotificationToastService] -';

    constructor(
        private logger: Logger,
        private toastr: ToastrService,
        private consultationService: ConsultationService,
        private notificationSoundService: NotificationSoundsService,
        private translateService: TranslateService,
        private conferenceStore: Store<ConferenceState>
    ) {
        this.notificationSoundService.initConsultationRequestRingtone();
    }

    getInviteKey(conferenceId: string, roomLabel: string): string {
        return `${conferenceId}_${roomLabel}`;
    }

    showConsultationInvite(
        roomLabel: string,
        conferenceId: string,
        consultationInvitation: ConsultationInvitation,
        requestedBy: VHParticipant,
        requestedFor: VHParticipant,
        participants: VHParticipant[],
        endpoints: VHEndpoint[],
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
            .map(p => p.displayName)
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
                    id: 'notification-toastr-invite-accept',
                    label: this.translateService.instant('notification-toastr.invite.accept'),
                    cssClass: 'green',
                    action: async () => {
                        await respondToConsultationRequest(ConsultationAnswer.Accepted);
                        this.toastr.remove(toast.toastId);
                    }
                },
                {
                    id: 'notification-toastr-invite-decline',
                    label: this.translateService.instant('notification-toastr.invite.decline'),
                    cssClass: 'red',
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
            onNoAction: () => {
                this.toastr.remove(toast.toastId);
            },
            buttons: [
                {
                    id: 'notification-toastr-create-consultation-notification-close',
                    label: this.translateService.instant('notification-toastr.linked-participants.button-close'),
                    cssClass: 'red',
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
            onNoAction: () => {
                this.logger.debug(`${this.loggerPrefix} No action called on poor connection alert`);
            },
            buttons: [
                {
                    id: 'notification-toastr-poor-connection-dismiss',
                    label: this.translateService.instant('notification-toastr.poor-connection.dismiss'),
                    cssClass: 'green',
                    action: async () => {
                        this.toastr.remove(toast.toastId);
                    }
                }
            ]
        };
    }

    showAudioRecordingErrorWithRestart(callback: Function) {
        this.logger.debug(`${this.loggerPrefix} creating 'audio recording error with restart' toastr notification`);

        let message = `<span class="govuk-!-font-weight-bold">${this.translateService.instant('audio-alert-with-restart.title')}</span>`;
        message += `<br/>${this.translateService.instant('audio-alert-with-restart.message')}<br/>`;
        const toastrMessage = this.translateService.instant('audio-alert-with-restart.message');

        const id = 'notification-toastr-audio-recording-error-restart.dismiss';
        const label = 'audio-alert-with-restart.button';

        return this.generateAudioAlertToastrComponent(toastrMessage, message, callback, id, label);
    }

    showAudioRecordingRestartSuccess() {
        this.logger.debug(`${this.loggerPrefix} creating 'audio recording restart success' toastr notification`);

        let message = `<span class="govuk-!-font-weight-bold">${this.translateService.instant('audio-alert-restart-success.title')}</span>`;
        message += `<br/>${this.translateService.instant('audio-alert-restart-success.message')}<br/>`;

        const toastrMessage = this.translateService.instant('audio-alert-restart-success.message');

        const id = 'notification-toastr-audio-recording-error-restart-success.dismiss';
        const label = 'audio-alert-restart-success.button';

        return this.generateAudioAlertToastrComponent(toastrMessage, message, null, id, label);
    }

    showAudioRecordingRestartFailure() {
        this.logger.debug(`${this.loggerPrefix} creating 'audio recording error restart failure' toastr notification`);

        let message = `<span class="govuk-!-font-weight-bold">${this.translateService.instant('audio-alert-restart-failure.title')}</span>`;
        message += `<br/>${this.translateService.instant('audio-alert-restart-failure.message')}<br/>`;
        const toastrMessage = this.translateService.instant('audio-alert-restart-failure.message');

        const id = 'notification-toastr-audio-recording-error-restart-failure.dismiss';
        const label = 'audio-alert-restart-failure.button';

        return this.generateAudioAlertToastrComponent(toastrMessage, message, null, id, label);
    }

    showParticipantAdded(participant: VHParticipant, inHearing: boolean = false): VhToastComponent {
        const messageBody = this.translateService.instant('notification-toastr.participant-added.message', {
            role: this.translateHearingRole(participant.hearingRole)
        });

        let message = `<span class="govuk-!-font-weight-bold toast-content toast-header">${this.translateService.instant(
            'notification-toastr.participant-added.title',
            {
                name: participant.name ?? participant.displayName
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
            htmlBody: message,
            onNoAction: () => {
                this.logger.debug(`${this.loggerPrefix} No action called on participant added alert`);
            },
            buttons: [
                {
                    id: 'notification-toastr-participant-added-dismiss',
                    label: this.translateService.instant('notification-toastr.participant-added.dismiss'),
                    cssClass: 'green',
                    action: async () => {
                        this.toastr.remove(toast.toastId);
                    }
                }
            ]
        };

        return toast.toastRef.componentInstance as VhToastComponent;
    }

    /**
     * Display a toast notification informing a participant has left the hearing room
     * @param participant the leaving participant
     * @param loggedInParticipantInVideo true if the logged in participant has a video stream on display (i.e. in consultation or in a hearing)
     * @returns a toast notification informing a participant has left
     */
    showParticipantLeftHearingRoom(participant: VHParticipant, loggedInParticipantInVideo: boolean = false): VhToastComponent {
        const messageBody = this.translateService.instant('notification-toastr.participant-left-hearing.message', {
            name: participant.name ?? participant.displayName
        });

        let message = `<span class="govuk-!-font-weight-bold toast-content toast-header">${this.translateService.instant(
            'notification-toastr.participant-left-hearing.title'
        )}</span>`;

        message += `<span class="toast-content toast-body">${messageBody}</span>`;

        const toast = this.toastr.show('', '', {
            timeOut: 0,
            extendedTimeOut: 0,
            tapToDismiss: false,
            toastComponent: VhToastComponent
        });
        (toast.toastRef.componentInstance as VhToastComponent).vhToastOptions = {
            color: loggedInParticipantInVideo ? 'white' : 'black',
            htmlBody: message,
            buttons: [
                {
                    id: 'notification-toastr-participant-left-hearing-dismiss',
                    label: this.translateService.instant('notification-toastr.participant-left-hearing.dismiss'),
                    cssClass: 'green',
                    action: async () => {
                        this.toastr.remove(toast.toastId);
                    }
                }
            ]
        };

        return toast.toastRef.componentInstance as VhToastComponent;
    }

    showEndpointAdded(endpoint: VHEndpoint, inHearing: boolean = false): VhToastComponent {
        const toastTitle = this.translateService.instant('notification-toastr.endpoint-added.title', {
            name: endpoint.displayName
        });
        const toastBody = this.translateService.instant('notification-toastr.endpoint-added.message');
        const buttonId = 'notification-toastr-endpoint-added-dismiss';
        const buttonLabel = this.translateService.instant('notification-toastr.endpoint-added.dismiss');
        return this.showEndpointToast(toastTitle, toastBody, inHearing, buttonId, buttonLabel);
    }

    showEndpointUpdated(endpoint: VHEndpoint, inHearing: boolean = false): VhToastComponent {
        const toastTitle = this.translateService.instant('notification-toastr.endpoint-updated.title', {
            name: endpoint.displayName
        });
        const toastBody = this.translateService.instant('notification-toastr.endpoint-updated.message');
        const buttonId = 'notification-toastr-endpoint-updated-dismiss';
        const buttonLabel = this.translateService.instant('notification-toastr.endpoint-updated.dismiss');
        return this.showEndpointToast(toastTitle, toastBody, inHearing, buttonId, buttonLabel);
    }

    showEndpointLinked(endpointDisplayName: string, inHearing: boolean = false): VhToastComponent {
        const toastTitle = this.translateService.instant('notification-toastr.endpoint-linked.title');
        const toastBody = this.translateService.instant('notification-toastr.endpoint-linked.message', {
            jvsEndpointName: endpointDisplayName
        });
        const buttonId = 'notification-toastr-endpoint-linked-dismiss';
        const buttonLabel = this.translateService.instant('notification-toastr.endpoint-linked.dismiss');
        return this.showEndpointToast(toastTitle, toastBody, inHearing, buttonId, buttonLabel);
    }

    showEndpointUnlinked(endpointDisplayName: string, inHearing: boolean = false): VhToastComponent {
        const toastTitle = this.translateService.instant('notification-toastr.endpoint-unlinked.title');
        const toastBody = this.translateService.instant('notification-toastr.endpoint-unlinked.message', {
            jvsEndpointName: endpointDisplayName
        });
        const buttonId = 'notification-toastr-endpoint-unlinked-dismiss';
        const buttonLabel = this.translateService.instant('notification-toastr.endpoint-unlinked.dismiss');
        return this.showEndpointToast(toastTitle, toastBody, inHearing, buttonId, buttonLabel);
    }

    showEndpointConsultationClosed(endpointDisplayName: string, inHearing: boolean = false): VhToastComponent {
        const toastTitle = this.translateService.instant('notification-toastr.endpoint-consultation-closed.title');
        const toastBody = this.translateService.instant('notification-toastr.endpoint-consultation-closed.message', {
            jvsEndpointName: endpointDisplayName
        });
        const buttonId = 'notification-toastr-endpoint-consultation-closed-dismiss';
        const buttonLabel = this.translateService.instant('notification-toastr.endpoint-consultation-closed.dismiss');
        return this.showEndpointToast(toastTitle, toastBody, inHearing, buttonId, buttonLabel);
    }

    showHearingLayoutchanged(participant: VHParticipant, inHearing: boolean = false): VhToastComponent {
        const messageBody = this.translateService.instant('notification-toastr.hearing-layout-changed.message');
        let message = `<span class="govuk-!-font-weight-bold toast-content toast-header">${this.translateService.instant(
            'notification-toastr.hearing-layout-changed.title',
            {
                name: participant.name ?? participant.displayName
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
            htmlBody: message,
            onNoAction: () => {
                this.logger.debug(`${this.loggerPrefix} No action called on hearing layout change alert`);
            },
            buttons: [
                {
                    id: 'notification-toastr-hearing-layout-changed-dismiss',
                    label: this.translateService.instant('notification-toastr.hearing-layout-changed.dismiss'),
                    cssClass: 'green',
                    action: async () => {
                        this.toastr.remove(toast.toastId);
                    }
                }
            ]
        };

        return toast.toastRef.componentInstance as VhToastComponent;
    }

    showHearingStarted(conferenceId: string, participantId: string): VhToastComponent {
        const messageBody = this.translateService.instant('notification-toastr.hearing-started.message');
        const title = this.translateService.instant('notification-toastr.hearing-started.title');

        let message = `<span class="govuk-!-font-weight-bold toast-content toast-header">${title}</span>`;
        message += `<span class="toast-content toast-body">${messageBody}</span>`;
        const joinHearingFromAlert = () => {
            this.logger.debug(
                `${this.loggerPrefix} Participant ${participantId} is join Hearing conference ${conferenceId} from Hearing Started Alert`
            );
            this.conferenceStore.dispatch(VideoCallHostActions.joinHearing({ conferenceId, participantId }));
        };
        const toast = this.toastr.show('', '', {
            timeOut: 0,
            extendedTimeOut: 0,
            tapToDismiss: false,
            toastComponent: VhToastComponent
        });
        (toast.toastRef.componentInstance as VhToastComponent).vhToastOptions = {
            color: 'white',
            htmlBody: message,
            onNoAction: () => {
                this.logger.debug(`${this.loggerPrefix} No action called on hearing started alert`);
            },
            buttons: [
                {
                    id: 'notification-toastr-hearing-started-join-hearing',
                    label: this.translateService.instant('notification-toastr.hearing-started.join-hearing'),
                    cssClass: 'hearing-started-join-hearing',
                    action: () => {
                        joinHearingFromAlert();
                    }
                },
                {
                    id: 'notification-toastr-hearing-started-dismiss',
                    label: this.translateService.instant('notification-toastr.hearing-started.dismiss'),
                    cssClass: 'hearing-started-dismiss',
                    action: async () => {
                        this.toastr.remove(toast.toastId);
                    }
                }
            ]
        };

        return toast.toastRef.componentInstance as VhToastComponent;
    }

    createAllocationNotificationToast(hearings: UpdatedAllocation[]): VhToastComponent {
        const toast = this.toastr.show('', '', {
            timeOut: 0,
            extendedTimeOut: 0,
            toastClass: 'vh-no-pointer',
            tapToDismiss: false,
            toastComponent: VhToastComponent
        });

        const header = `<div class="govuk-!-font-weight-bold toast-content toast-header">${this.translateService.instant(
            'allocations-toastr.header'
        )}</div></br></br>`;

        let messageBody = '';

        hearings.forEach(h => {
            const judge = h.conference.participants?.find(x => x.role === Role.Judge)?.display_name;
            const options = { hour: '2-digit', minute: '2-digit', hour12: false } as Intl.DateTimeFormatOptions;
            const time = new Date(h.conference.scheduled_date_time).toLocaleTimeString('en-GB', options);
            const caseName = h.conference.case_name;

            messageBody += '<div class="govuk-!-font-weight-bold">' + time + '</div>';
            if (judge) {
                messageBody += '<div class="govuk-!-font-weight-bold">' + judge + '</div>';
            }
            messageBody += '<div class="govuk-!-font-weight-bold">' + caseName + '</div>';
            messageBody += '</br></br>';
        });

        const message: string = header + `<div class="toast-content toast-body">${messageBody}</div>`;

        (toast.toastRef.componentInstance as VhToastComponent).vhToastOptions = {
            color: 'black',
            htmlBody: message,
            onNoAction: () => {
                this.logger.debug(`${this.loggerPrefix} No action called on allocation hearing alert`);
            },
            buttons: [
                {
                    id: 'notification-toastr-create-consultation-notification-close',
                    label: this.translateService.instant('notification-toastr.linked-participants.button-close'),
                    cssClass: 'red',
                    action: async () => {
                        this.toastr.remove(toast.toastId);
                    }
                }
            ]
        };

        return toast.toastRef.componentInstance as VhToastComponent;
    }

    private generateAudioAlertToastrComponent(toastrMessage, message, callback, id, label) {
        const toast = this.toastr.show(toastrMessage, '', {
            tapToDismiss: false,
            toastComponent: VhToastComponent,
            disableTimeOut: true
        });
        (toast.toastRef.componentInstance as VhToastComponent).vhToastOptions = {
            color: 'white',
            htmlBody: message,
            buttons: [
                {
                    id: id,
                    label: this.translateService.instant(label),
                    cssClass: 'green',
                    action: () => {
                        this.toastr.remove(toast.toastId);
                        if (callback) {
                            callback();
                        }
                    }
                }
            ],
            concludeToast: () => {
                this.toastr.remove(toast.toastId);
                this.showAudioRecordingRestartSuccess();
            },
            onNoAction: () => {
                this.toastr.remove(toast.toastId);
            }
        };
        return toast.toastRef.componentInstance as VhToastComponent;
    }

    private showEndpointToast(
        toastTitle: string,
        toastBody: string,
        inHearing: boolean,
        buttonId: string,
        buttonLabel: string
    ): VhToastComponent {
        let message = `<span class="govuk-!-font-weight-bold toast-content toast-header">${toastTitle}</span>`;
        message += `<span class="toast-content toast-body">${toastBody}</span>`;

        const toast = this.toastr.show('', '', {
            timeOut: 0,
            extendedTimeOut: 0,
            tapToDismiss: false,
            toastComponent: VhToastComponent
        });
        (toast.toastRef.componentInstance as VhToastComponent).vhToastOptions = {
            color: inHearing ? 'white' : 'black',
            htmlBody: message,
            onNoAction: () => {
                this.logger.debug(`${this.loggerPrefix} No action called on endpoint added alert`);
            },
            buttons: [
                {
                    id: buttonId,
                    label: buttonLabel,
                    cssClass: 'green',
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

    private stringToTranslateId(str: string) {
        return str?.replace(/\s/g, '-').toLowerCase();
    }
}
