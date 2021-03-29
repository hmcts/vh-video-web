import { ActiveToast } from 'ngx-toastr';
import { ConsultationAnswer } from 'src/app/services/clients/api-client';
import { Logger } from 'src/app/services/logging/logger-base';
import { Participant } from 'src/app/shared/models/participant';
import { VhToastComponent } from 'src/app/shared/toast/vh-toast.component';
import { translateServiceSpy } from 'src/app/testing/mocks/mock-translation.service';
import { MockLogger } from 'src/app/testing/mocks/mock-logger';
import { HeartbeatHealth, ParticipantHeartbeat } from '../../services/models/participant-heartbeat';
import {
    consultationService,
    globalConference,
    globalParticipant,
    globalWitness,
    globalEndpoint,
    notificationSoundsService,
    toastrService
} from '../waiting-room-shared/tests/waiting-room-base-setup';
import { NotificationToastrService } from './notification-toastr.service';

describe('NotificationToastrService', () => {
    let service: NotificationToastrService;
    const logger: Logger = new MockLogger();
    let roomLabel: string;
    const translateService = translateServiceSpy;

    beforeAll(() => {});

    beforeEach(() => {
        service = new NotificationToastrService(logger, toastrService, consultationService, notificationSoundsService, translateService);
        roomLabel = 'Meeting room 1';
        consultationService.respondToConsultationRequest.calls.reset();
        notificationSoundsService.playConsultationRequestRingtone.calls.reset();
        notificationSoundsService.stopConsultationRequestRingtone.calls.reset();
    });

    it('should create', async () => {
        expect(service).toBeTruthy();
    });

    it('showConsultationInvite should only show invite for room once', async () => {
        // Arrange
        const mockToast = {
            toastRef: {
                componentInstance: {}
            }
        } as ActiveToast<VhToastComponent>;
        toastrService.show.and.returnValue(mockToast);
        const p = new Participant(globalParticipant);

        // Act
        service.showConsultationInvite(roomLabel, globalConference.id, p, p, [p], [], false);
        service.showConsultationInvite(roomLabel, globalConference.id, p, p, [p], [], false);
        service.showConsultationInvite(roomLabel, globalConference.id, p, p, [p], [], false);

        // Assert
        expect(notificationSoundsService.playConsultationRequestRingtone).toHaveBeenCalledTimes(1);
    });

    it('showConsultationInvite should allow another invite after responded', async () => {
        // Arrange
        const mockToast = {
            toastRef: {
                componentInstance: {}
            }
        } as ActiveToast<VhToastComponent>;
        toastrService.show.and.returnValue(mockToast);
        toastrService.toasts = [mockToast];
        const p = new Participant(globalParticipant);

        // Act
        service.showConsultationInvite(roomLabel, globalConference.id, p, p, [p], [], false);
        await mockToast.toastRef.componentInstance.vhToastOptions.onNoAction();
        service.showConsultationInvite(roomLabel, globalConference.id, p, p, [p], [], false);
        await mockToast.toastRef.componentInstance.vhToastOptions.onNoAction();
        service.showConsultationInvite(roomLabel, globalConference.id, p, p, [p], [], false);

        // Assert
        expect(notificationSoundsService.playConsultationRequestRingtone).toHaveBeenCalledTimes(3);
    });

    it('showConsultationInvite should play notification ringtone if not in conference', async () => {
        // Arrange
        const mockToast = {
            toastRef: {
                componentInstance: {}
            }
        } as ActiveToast<VhToastComponent>;
        toastrService.show.and.returnValue(mockToast);
        const p = new Participant(globalParticipant);

        // Act
        service.showConsultationInvite(roomLabel, globalConference.id, p, p, [p], [], false);

        // Assert
        expect(notificationSoundsService.playConsultationRequestRingtone).toHaveBeenCalledTimes(1);
    });

    it('showConsultationInvite should not play notification ringtone if in conference', async () => {
        // Arrange
        const mockToast = {
            toastRef: {
                componentInstance: {}
            }
        } as ActiveToast<VhToastComponent>;
        toastrService.show.and.returnValue(mockToast);
        const p = new Participant(globalParticipant);

        // Act
        service.showConsultationInvite(roomLabel, globalConference.id, p, p, [p], [], true);

        // Assert
        expect(notificationSoundsService.playConsultationRequestRingtone).toHaveBeenCalledTimes(0);
    });

    it('showConsultationInvite should set colour to white if in conference', async () => {
        // Arrange
        const mockToast = {
            toastRef: {
                componentInstance: {}
            }
        } as ActiveToast<VhToastComponent>;
        toastrService.show.and.returnValue(mockToast);
        const p = new Participant(globalParticipant);

        // Act
        service.showConsultationInvite(roomLabel, globalConference.id, p, p, [p], [], true);

        // Assert
        expect(mockToast.toastRef.componentInstance.vhToastOptions.color).toBe('white');
    });

    it('showConsultationInvite should set colour to black if not in conference', async () => {
        // Arrange
        const mockToast = {
            toastRef: {
                componentInstance: {}
            }
        } as ActiveToast<VhToastComponent>;
        toastrService.show.and.returnValue(mockToast);
        const p = new Participant(globalParticipant);

        // Act
        service.showConsultationInvite(roomLabel, globalConference.id, p, p, [p], [], false);

        // Assert
        expect(mockToast.toastRef.componentInstance.vhToastOptions.color).toBe('black');
    });

    it('showConsultationInvite should respond to consultation request on toastr on action', async () => {
        // Arrange
        const mockToast = {
            toastRef: {
                componentInstance: {}
            }
        } as ActiveToast<VhToastComponent>;
        toastrService.show.and.returnValue(mockToast);
        toastrService.toasts = [mockToast];
        const p = new Participant(globalParticipant);

        // Act
        service.showConsultationInvite(roomLabel, globalConference.id, p, p, [p], [], false);
        await mockToast.toastRef.componentInstance.vhToastOptions.onNoAction();

        // Assert
        expect(consultationService.respondToConsultationRequest).toHaveBeenCalledWith(
            globalConference.id,
            p.id,
            p.id,
            ConsultationAnswer.None,
            roomLabel
        );
        expect(consultationService.respondToConsultationRequest).toHaveBeenCalledTimes(1);
        expect(notificationSoundsService.stopConsultationRequestRingtone).toHaveBeenCalledTimes(1);
    });

    it('showConsultationInvite should join participants display names - no endpoints', async () => {
        // Arrange
        const mockToast = {
            toastRef: {
                componentInstance: {}
            }
        } as ActiveToast<VhToastComponent>;
        toastrService.show.and.returnValue(mockToast);
        toastrService.toasts = [mockToast];
        const p = new Participant(globalParticipant);
        const p2 = new Participant(globalWitness);

        // Act
        service.showConsultationInvite(roomLabel, globalConference.id, p, p, [p, p2], [], false);

        // Assert
        expect(mockToast.toastRef.componentInstance.vhToastOptions.htmlBody).toBe(
            '<span class="govuk-!-font-weight-bold">notification-toastr.invite.call-from</span><br/>notification-toastr.invite.with<br/>Chris Witness'
        );
    });

    it('showConsultationInvite should join participants display names - participants and endpoints', async () => {
        // Arrange
        const mockToast = {
            toastRef: {
                componentInstance: {}
            }
        } as ActiveToast<VhToastComponent>;
        toastrService.show.and.returnValue(mockToast);
        toastrService.toasts = [mockToast];
        const p = new Participant(globalParticipant);
        const p2 = new Participant(globalWitness);
        const endpoint = globalEndpoint;

        // Act
        service.showConsultationInvite(roomLabel, globalConference.id, p, p, [p, p2], [endpoint], false);

        // Assert
        expect(mockToast.toastRef.componentInstance.vhToastOptions.htmlBody).toBe(
            '<span class="govuk-!-font-weight-bold">notification-toastr.invite.call-from</span><br/>notification-toastr.invite.with<br/>Chris Witness<br/>DispName1'
        );
    });

    it('showConsultationInvite should join participants display names - single participant', async () => {
        // Arrange
        const mockToast = {
            toastRef: {
                componentInstance: {}
            }
        } as ActiveToast<VhToastComponent>;
        toastrService.show.and.returnValue(mockToast);
        toastrService.toasts = [mockToast];
        const p = new Participant(globalParticipant);

        // Act
        service.showConsultationInvite(roomLabel, globalConference.id, p, p, [p], [], false);

        // Assert
        expect(mockToast.toastRef.componentInstance.vhToastOptions.htmlBody).toBe(
            '<span class="govuk-!-font-weight-bold">notification-toastr.invite.call-from</span>'
        );
    });

    it('showConsultationInvite should add accept button', async () => {
        // Arrange
        const mockToast = {
            toastRef: {
                componentInstance: {}
            }
        } as ActiveToast<VhToastComponent>;
        toastrService.show.and.returnValue(mockToast);
        toastrService.toasts = [mockToast];
        const p = new Participant(globalParticipant);

        // Act
        service.showConsultationInvite(roomLabel, globalConference.id, p, p, [p], [], false);
        await mockToast.toastRef.componentInstance.vhToastOptions.buttons[0].action();

        // Assert
        expect(mockToast.toastRef.componentInstance.vhToastOptions.buttons[0].hoverColour).toBe('green');
        expect(mockToast.toastRef.componentInstance.vhToastOptions.buttons[0].label).toBe('notification-toastr.invite.accept');
        expect(consultationService.respondToConsultationRequest).toHaveBeenCalledWith(
            globalConference.id,
            p.id,
            p.id,
            ConsultationAnswer.Accepted,
            roomLabel
        );
        expect(consultationService.respondToConsultationRequest).toHaveBeenCalledTimes(1);
        expect(notificationSoundsService.stopConsultationRequestRingtone).toHaveBeenCalledTimes(1);
        expect(toastrService.clear).toHaveBeenCalledTimes(1);
    });

    it('showConsultationInvite should add decline button', async () => {
        // Arrange
        const mockToast = {
            toastRef: {
                componentInstance: {}
            }
        } as ActiveToast<VhToastComponent>;
        toastrService.show.and.returnValue(mockToast);
        toastrService.toasts = [mockToast];
        const p = new Participant(globalParticipant);

        // Act
        service.showConsultationInvite(roomLabel, globalConference.id, p, p, [p], [], false);
        await mockToast.toastRef.componentInstance.vhToastOptions.buttons[1].action();

        // Assert
        expect(mockToast.toastRef.componentInstance.vhToastOptions.buttons[1].hoverColour).toBe('red');
        expect(mockToast.toastRef.componentInstance.vhToastOptions.buttons[1].label).toBe('notification-toastr.invite.decline');
        expect(consultationService.respondToConsultationRequest).toHaveBeenCalledWith(
            globalConference.id,
            p.id,
            p.id,
            ConsultationAnswer.Rejected,
            roomLabel
        );
        expect(consultationService.respondToConsultationRequest).toHaveBeenCalledTimes(1);
        expect(notificationSoundsService.stopConsultationRequestRingtone).toHaveBeenCalledTimes(1);
    });

    it('showConsultationInvite should set correct toastr properties', async () => {
        // Arrange
        const mockToast = {
            toastRef: {
                componentInstance: {}
            }
        } as ActiveToast<VhToastComponent>;
        toastrService.show
            .withArgs('', '', {
                timeOut: 120000,
                tapToDismiss: false,
                toastComponent: VhToastComponent
            })
            .and.returnValue(mockToast);
        const p = new Participant(globalParticipant);

        // Act
        service.showConsultationInvite(roomLabel, globalConference.id, p, p, [p], [], false);

        // Assert
        expect(mockToast.toastRef.componentInstance).not.toBeNull();
    });

    it('show poor connection should only show once in 2 min', async () => {
        // Arrange
        const mockToast = {
            toastRef: {
                componentInstance: {}
            }
        } as ActiveToast<VhToastComponent>;
        toastrService.show.and.returnValue(mockToast);

        // Act
        for (let i = 0; i < 26; i++) {
            service.reportPoorConnection(
                new ParticipantHeartbeat(globalConference.id, globalParticipant.id, HeartbeatHealth.Poor, '', '', '', '')
            );
        }

        // Assert
        expect(service.activeHeartbeatReport.length).toBe(1);
    });
    it(' should collect poor connection event count until it is reached  2 min limit', async () => {
        // Arrange
        const mockToast = {
            toastRef: {
                componentInstance: {}
            }
        } as ActiveToast<VhToastComponent>;
        toastrService.show.and.returnValue(mockToast);

        // Act
        for (let i = 0; i < 23; i++) {
            service.reportPoorConnection(
                new ParticipantHeartbeat(globalConference.id, globalParticipant.id, HeartbeatHealth.Poor, '', '', '', '')
            );
        }

        // Assert
        expect(service.activeHeartbeatReport.length).toBe(23);
    });
});
