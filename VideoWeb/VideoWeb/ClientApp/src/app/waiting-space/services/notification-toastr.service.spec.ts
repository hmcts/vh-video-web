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

    describe('showConsultationInvite', () => {
        it('should only show invite for room once', async () => {
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

        it('should allow another invite after responded', async () => {
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

        it('should play notification ringtone if not in conference', async () => {
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

        it('should not play notification ringtone if in conference', async () => {
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

        it('should set colour to white if in conference', async () => {
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

        it('should set colour to black if not in conference', async () => {
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

        it('should respond to consultation request on toastr on action', async () => {
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

        it('should join participants display names - no endpoints', async () => {
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

        it('should join participants display names - participants and endpoints', async () => {
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

        it('should join participants display names - single participant', async () => {
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

        it('should add accept button', async () => {
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

        it('should add decline button', async () => {
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

        it('should set correct toastr properties', async () => {
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
    });

    describe('showConsultationRejectedByLinkedParticipant', () => {
        const expectedParticipantName = "First Last";
        const expectedConsulationRoomLabel = "Consultation Room";
        const expectedToastId = 2;
        const expectedInHearingColor = 'white';
        const expectedNotInHearingColor = 'black';
        const expectedBody = `${expectedParticipantName} rejected the invitation to ${expectedConsulationRoomLabel}.`;
        let mockToast : ActiveToast<VhToastComponent>;

        beforeEach(() => {
        toastrService.show.calls.reset();
        toastrService.remove.calls.reset();
        mockToast = {
                toastId : expectedToastId,
                toastRef: {
                    componentInstance: {}
                }
            } as ActiveToast<VhToastComponent>;
        })

        it('should call toastr.show with the correct parameters', () => {
            // Act
            service.showConsultationRejectedByLinkedParticipant(expectedParticipantName, expectedConsulationRoomLabel, true);

            // Assert
            expect(toastrService.show).toHaveBeenCalledOnceWith('', '', {
                timeOut : 120000,
                extendedTimeOut : 0,
                toastClass : 'vh-no-pointer',
                tapToDismiss : false,
                toastComponent : VhToastComponent
            });
        });

        describe('expected toast configuration', () => {
            it('should have a button to close the toast', () => {
                // Arrange
                const expectedHoverColor = 'red';
                const expectedLabel = 'notification-toastr.invite.decline';
                toastrService.show.and.returnValue(mockToast);

                // Act
                const toastComponentInstance = service.showConsultationRejectedByLinkedParticipant(expectedParticipantName, expectedConsulationRoomLabel, true);

                // Assert
                expect(toastComponentInstance.vhToastOptions.buttons.length).toBe(1);
                expect(toastComponentInstance.vhToastOptions.buttons[0]).toBeTruthy();
                expect(toastComponentInstance.vhToastOptions.buttons[0].hoverColour).toBe(expectedHoverColor);
                expect(toastComponentInstance.vhToastOptions.buttons[0].label).toBe(expectedLabel);
            });

            it('should call toastr.remove with the toast id when the button action is triggered', () => {
                // Arrange
                const expectedHoverColor = 'red';
                const expectedLabel = 'notification-toastr.invite.decline';
                toastrService.show.and.returnValue(mockToast);

                const toastComponentInstance = service.showConsultationRejectedByLinkedParticipant(expectedParticipantName, expectedConsulationRoomLabel, true);
                const button = toastComponentInstance.vhToastOptions.buttons[0];

                // Act
                button.action();

                // Assert
                expect(toastrService.remove).toHaveBeenCalledOnceWith(expectedToastId);
            });

            it('should call toastr.remove with the toast id when the NO action is triggered', () => {
                // Arrange
                const expectedHoverColor = 'red';
                const expectedLabel = 'notification-toastr.invite.decline';
                toastrService.show.and.returnValue(mockToast);

                const toastComponentInstance = service.showConsultationRejectedByLinkedParticipant(expectedParticipantName, expectedConsulationRoomLabel, true);

                // Act
                toastComponentInstance.vhToastOptions.onNoAction();

                // Assert
                expect(toastrService.remove).toHaveBeenCalledOnceWith(expectedToastId);
            });

            it('should have a correctly formatted body', () => {
                // Act
                const toastComponentInstance = service.showConsultationRejectedByLinkedParticipant(expectedParticipantName, expectedConsulationRoomLabel, true);

                // Assert
                expect(toastComponentInstance.vhToastOptions.htmlBody).toBe(expectedBody);
            });

            it('should have the color black when NOT in hearing', () => {
                // Arrange
                const expectedColor = 'black';

                // Act
                const toastComponentInstance = service.showConsultationRejectedByLinkedParticipant(expectedParticipantName, expectedConsulationRoomLabel, false);

                // Assert
                expect(toastComponentInstance.vhToastOptions.color).toBe(expectedColor);
            });

            it('should have the color white when in hearing', () => {
                // Arrange
                const expectedColor = 'white';

                // Act
                const toastComponentInstance = service.showConsultationRejectedByLinkedParticipant(expectedParticipantName, expectedConsulationRoomLabel, true);

                // Assert
                expect(toastComponentInstance.vhToastOptions.color).toBe(expectedColor);
            });
        });
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

    it('should collect poor connection event count until it is reached  2 min limit', async () => {
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
