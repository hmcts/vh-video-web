import { ActiveToast } from 'ngx-toastr';
import { ConsultationAnswer, ParticipantResponse, Role } from 'src/app/services/clients/api-client';
import { Logger } from 'src/app/services/logging/logger-base';
import { Participant } from 'src/app/shared/models/participant';
import { VhToastComponent } from 'src/app/shared/toast/vh-toast.component';
import { MockLogger } from 'src/app/testing/mocks/mock-logger';
import { HeartbeatHealth, ParticipantHeartbeat } from '../../services/models/participant-heartbeat';
import {
    consultationService,
    globalConference,
    globalParticipant,
    globalWitness,
    globalEndpoint,
    notificationSoundsService,
    toastrService,
    initAllWRDependencies
} from '../waiting-room-shared/tests/waiting-room-base-setup';
import { NotificationToastrService } from './notification-toastr.service';
import { ConsultationInvitation } from './consultation-invitation.service';
import { TranslateService } from '@ngx-translate/core';

describe('NotificationToastrService', () => {
    let service: NotificationToastrService;
    const logger: Logger = new MockLogger();
    let roomLabel: string;
    let translateServiceSpy: jasmine.SpyObj<TranslateService>;

    beforeAll(() => {
        initAllWRDependencies();
    });

    beforeEach(() => {
        translateServiceSpy = jasmine.createSpyObj<TranslateService>('TranslateService', ['instant']);
        translateServiceSpy.instant.and.callFake(k => k);
        service = new NotificationToastrService(logger, toastrService, consultationService, notificationSoundsService, translateServiceSpy);
        roomLabel = 'Meeting room 1';
        consultationService.respondToConsultationRequest.calls.reset();
        notificationSoundsService.playConsultationRequestRingtone.calls.reset();
        notificationSoundsService.stopConsultationRequestRingtone.calls.reset();
    });

    it('should create', async () => {
        expect(service).toBeTruthy();
    });

    describe('showConsultationInvite', () => {
        const expectedInvitationId = 'invitation-id';
        const invitation = {
            invitationId: expectedInvitationId
        } as ConsultationInvitation;
        beforeEach(() => {
            toastrService.remove.calls.reset();
        });

        it('should remove any active rejected by linked participant toasts for the invite key', async () => {
            // Arrange
            const expectedInviteKey = 'invite-key';
            const participant = new Participant(globalParticipant);
            const mockToast = {
                toastRef: {
                    componentInstance: {}
                }
            } as ActiveToast<VhToastComponent>;

            toastrService.show.and.returnValue(mockToast);
            spyOn(service, 'getInviteKey').and.returnValue(expectedInviteKey);

            const existingRejectedToast = jasmine.createSpyObj<VhToastComponent>('VhToastComponent', ['remove']);
            service.activeLinkedParticipantRejectionToasts[expectedInviteKey] = existingRejectedToast;

            // Act
            service.showConsultationInvite(roomLabel, globalConference.id, invitation, participant, participant, [participant], [], false);

            // Assert
            expect(existingRejectedToast.remove).toHaveBeenCalledTimes(1);
        });

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
            service.showConsultationInvite(roomLabel, globalConference.id, invitation, p, p, [p], [], false);
            service.showConsultationInvite(roomLabel, globalConference.id, invitation, p, p, [p], [], false);
            service.showConsultationInvite(roomLabel, globalConference.id, invitation, p, p, [p], [], false);

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
            service.showConsultationInvite(roomLabel, globalConference.id, invitation, p, p, [p], [], false);
            await mockToast.toastRef.componentInstance.vhToastOptions.onNoAction();
            service.showConsultationInvite(roomLabel, globalConference.id, invitation, p, p, [p], [], false);
            await mockToast.toastRef.componentInstance.vhToastOptions.onNoAction();
            service.showConsultationInvite(roomLabel, globalConference.id, invitation, p, p, [p], [], false);

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
            service.showConsultationInvite(roomLabel, globalConference.id, invitation, p, p, [p], [], false);

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
            service.showConsultationInvite(roomLabel, globalConference.id, invitation, p, p, [p], [], true);

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
            service.showConsultationInvite(roomLabel, globalConference.id, invitation, p, p, [p], [], true);

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
            service.showConsultationInvite(roomLabel, globalConference.id, invitation, p, p, [p], [], false);

            // Assert
            expect(mockToast.toastRef.componentInstance.vhToastOptions.color).toBe('black');
        });

        it('should respond to consultation request on toastr on NO action', async () => {
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
            service.showConsultationInvite(roomLabel, globalConference.id, invitation, p, p, [p], [], false);
            await mockToast.toastRef.componentInstance.vhToastOptions.onNoAction();

            // Assert
            expect(consultationService.respondToConsultationRequest).toHaveBeenCalledWith(
                globalConference.id,
                invitation.invitationId,
                p.id,
                p.id,
                ConsultationAnswer.Rejected,
                roomLabel
            );
            expect(consultationService.respondToConsultationRequest).toHaveBeenCalledTimes(1);
        });

        it('should respond stop the sound playing and clear toasts on remove action', async () => {
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
            service.showConsultationInvite(roomLabel, globalConference.id, invitation, p, p, [p], [], false);
            await mockToast.toastRef.componentInstance.vhToastOptions.onRemove();

            // Assert
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
            service.showConsultationInvite(roomLabel, globalConference.id, invitation, p, p, [p2], [], false);

            // Assert
            expect(mockToast.toastRef.componentInstance.vhToastOptions.htmlBody).toBe(
                `<span class="govuk-!-font-weight-bold">notification-toastr.invite.call-from</span><br/>notification-toastr.invite.with<br/>${p2.displayName}`
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
            service.showConsultationInvite(roomLabel, globalConference.id, invitation, p, p, [p, p2], [endpoint], false);

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
            service.showConsultationInvite(roomLabel, globalConference.id, invitation, p, p, [p], [], false);

            // Assert
            expect(mockToast.toastRef.componentInstance.vhToastOptions.htmlBody).toBe(
                '<span class="govuk-!-font-weight-bold">notification-toastr.invite.call-from</span>'
            );
        });

        it('should add accept button', async () => {
            // Arrange
            const mockToast = {
                toastId: 2,
                toastRef: {
                    componentInstance: {}
                }
            } as ActiveToast<VhToastComponent>;
            toastrService.show.and.returnValue(mockToast);
            toastrService.toasts = [mockToast];
            const p = new Participant(globalParticipant);

            // Act
            service.showConsultationInvite(roomLabel, globalConference.id, invitation, p, p, [p], [], false);
            await mockToast.toastRef.componentInstance.vhToastOptions.buttons[0].action();

            // Assert
            expect(mockToast.toastRef.componentInstance.vhToastOptions.buttons[0].hoverColour).toBe('green');
            expect(mockToast.toastRef.componentInstance.vhToastOptions.buttons[0].label).toBe('notification-toastr.invite.accept');
            expect(consultationService.respondToConsultationRequest).toHaveBeenCalledWith(
                globalConference.id,
                invitation.invitationId,
                p.id,
                p.id,
                ConsultationAnswer.Accepted,
                roomLabel
            );
            expect(consultationService.respondToConsultationRequest).toHaveBeenCalledTimes(1);
            expect(toastrService.remove).toHaveBeenCalledOnceWith(mockToast.toastId);
        });

        it('should add decline button', async () => {
            // Arrange
            const mockToast = {
                toastId: 2,
                toastRef: {
                    componentInstance: {}
                }
            } as ActiveToast<VhToastComponent>;
            toastrService.show.and.returnValue(mockToast);
            toastrService.toasts = [mockToast];
            const p = new Participant(globalParticipant);

            // Act
            service.showConsultationInvite(roomLabel, globalConference.id, invitation, p, p, [p], [], false);
            await mockToast.toastRef.componentInstance.vhToastOptions.buttons[1].action();

            // Assert
            expect(mockToast.toastRef.componentInstance.vhToastOptions.buttons[1].hoverColour).toBe('red');
            expect(mockToast.toastRef.componentInstance.vhToastOptions.buttons[1].label).toBe('notification-toastr.invite.decline');
            expect(consultationService.respondToConsultationRequest).toHaveBeenCalledWith(
                globalConference.id,
                invitation.invitationId,
                p.id,
                p.id,
                ConsultationAnswer.Rejected,
                roomLabel
            );
            expect(consultationService.respondToConsultationRequest).toHaveBeenCalledTimes(1);
            expect(toastrService.remove).toHaveBeenCalledOnceWith(mockToast.toastId);
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
            service.showConsultationInvite(roomLabel, globalConference.id, invitation, p, p, [p], [], false);

            // Assert
            expect(mockToast.toastRef.componentInstance).not.toBeNull();
        });
    });

    describe('getInviteKey', () => {
        it('should return the invite key in the correct format', () => {
            // Arrange
            const conferenceId = 'conference_id';
            const expectedInviteKey = `${conferenceId}_${roomLabel}`;

            // Act
            const inviteKey = service.getInviteKey(conferenceId, roomLabel);

            // Assert
            expect(inviteKey).toEqual(expectedInviteKey);
        });
    });

    describe('showConsultationRejectedByLinkedParticipant', () => {
        const expectedParticipantName = 'First Last';
        const expectedInvitedBy = 'Consultation Room';
        const expectedTranslationString = 'notification-toastr.linked-participants.rejected';
        const expectedBody = `<span class="govuk-!-font-weight-bold">${expectedTranslationString}</span>`;
        const expectedConferenceId = 'conference_id';
        const expectedRoomLabel = 'room_label';
        let mockToast: jasmine.SpyObj<VhToastComponent>;

        beforeEach(() => {
            toastrService.show.calls.reset();
            toastrService.remove.calls.reset();
            mockToast = jasmine.createSpyObj<VhToastComponent>('VhToastCompoenet', ['remove']);
        });

        it('should call create consultation toast with correct message and store it in the active rejection toasts', () => {
            // Arrange
            const expectedInHearing = false;
            const expectedInviteKey = 'invite-key';

            spyOn(service, 'createConsultationNotificationToast').and.returnValue(mockToast);
            spyOn(service, 'getInviteKey').and.returnValue(expectedInviteKey);

            // Act
            service.showConsultationRejectedByLinkedParticipant(
                expectedConferenceId,
                expectedRoomLabel,
                expectedParticipantName,
                expectedInvitedBy,
                expectedInHearing
            );

            // Assert
            expect(service.createConsultationNotificationToast).toHaveBeenCalledOnceWith(expectedBody, expectedInHearing);
            expect(translateServiceSpy.instant).toHaveBeenCalledTimes(1);
            expect(translateServiceSpy.instant).toHaveBeenCalledWith(expectedTranslationString, {
                rejector: expectedParticipantName,
                invitedBy: expectedInvitedBy
            });
            expect(service.activeLinkedParticipantRejectionToasts[expectedInviteKey]).toBeTruthy();
            expect(service.activeLinkedParticipantRejectionToasts[expectedInviteKey]).toBe(mockToast);
        });

        it('should remove the existing active rejection toast for the same invite key if it exists', () => {
            // Arrange
            const expectedInHearing = false;
            const expectedInviteKey = 'invite-key';

            spyOn(service, 'createConsultationNotificationToast').and.returnValue(mockToast);
            spyOn(service, 'getInviteKey').and.returnValue(expectedInviteKey);

            const initialToast = jasmine.createSpyObj<VhToastComponent>('VhToastCompoenet', ['remove']);
            service.activeLinkedParticipantRejectionToasts[expectedInviteKey] = initialToast;

            // Act
            service.showConsultationRejectedByLinkedParticipant(
                expectedConferenceId,
                expectedRoomLabel,
                expectedParticipantName,
                expectedInvitedBy,
                expectedInHearing
            );

            // Assert
            expect(service.createConsultationNotificationToast).toHaveBeenCalledOnceWith(expectedBody, expectedInHearing);
            expect(translateServiceSpy.instant).toHaveBeenCalledTimes(1);
            expect(translateServiceSpy.instant).toHaveBeenCalledWith(expectedTranslationString, {
                rejector: expectedParticipantName,
                invitedBy: expectedInvitedBy
            });
            expect(service.activeLinkedParticipantRejectionToasts[expectedInviteKey]).toBeTruthy();
            expect(service.activeLinkedParticipantRejectionToasts[expectedInviteKey]).toBe(mockToast);
            expect(initialToast.remove).toHaveBeenCalledTimes(1);
        });
    });

    describe('showWaitingForLinkedParticipantsToAccept', () => {
        const linkedParticipantName = ['Linked Participant 1'];
        const multipleLinkedParticipantNames = ['Linked Participant 1', 'Linked Participant 2'];
        const expectedInvitedBy = 'Consultation Room';
        const expectedToastId = 2;
        const expectedTranslationString = 'notification-toastr.linked-participants.waiting-single';
        const expectedBody = `<span class="govuk-!-font-weight-bold">${expectedTranslationString}</span>`;
        const expectedTranslationStringForMultipleParticipants = 'notification-toastr.linked-participants.waiting-multiple';
        const expectedBodyForMultipleParticipants = `<span class="govuk-!-font-weight-bold">${expectedTranslationStringForMultipleParticipants}</span>`;

        beforeEach(() => {
            toastrService.show.calls.reset();
            toastrService.remove.calls.reset();
            translateServiceSpy.instant.calls.reset();
        });

        it('should call create consultation toast with correct message for a single linked participant', () => {
            // Arrange
            const expectedInHearing = false;

            spyOn(service, 'createConsultationNotificationToast');

            // Act
            const toastComponentInstance = service.showWaitingForLinkedParticipantsToAccept(
                linkedParticipantName,
                expectedInvitedBy,
                expectedInHearing
            );

            // Assert
            expect(service.createConsultationNotificationToast).toHaveBeenCalledOnceWith(expectedBody, expectedInHearing);
            expect(translateServiceSpy.instant).toHaveBeenCalledTimes(1);
            expect(translateServiceSpy.instant).toHaveBeenCalledWith(expectedTranslationString, {
                name: linkedParticipantName[0],
                invitedBy: expectedInvitedBy
            });
        });

        it('should have a correctly formatted body for multiple linked participants', () => {
            // Arrange
            const expectedInHearing = true;

            spyOn(service, 'createConsultationNotificationToast');

            // Act
            const toastComponentInstance = service.showWaitingForLinkedParticipantsToAccept(
                multipleLinkedParticipantNames,
                expectedInvitedBy,
                expectedInHearing
            );

            // Assert
            expect(service.createConsultationNotificationToast).toHaveBeenCalledOnceWith(
                expectedBodyForMultipleParticipants,
                expectedInHearing
            );
            expect(translateServiceSpy.instant).toHaveBeenCalledTimes(1);
            expect(translateServiceSpy.instant).toHaveBeenCalledWith(expectedTranslationStringForMultipleParticipants, {
                number: multipleLinkedParticipantNames.length,
                invitedBy: expectedInvitedBy
            });
        });
    });

    describe('showAudioRecordingError', () => {
        it('should return the audio alert component', () => {
            const mockToast = {
                toastRef: {
                    componentInstance: {}
                }
            } as ActiveToast<VhToastComponent>;
            toastrService.show.and.returnValue(mockToast);
            const callback = jasmine.createSpy();

            const result = service.showAudioRecordingError(callback);

            expect(result).toBeDefined();
            expect(result.vhToastOptions.htmlBody).toContain('audio-alert.title');
        });
    });

    describe('createConsultationNotificationToast', () => {
        let mockToast: ActiveToast<VhToastComponent>;
        const expectedToastId = 2;
        const expectedMessage = 'message';
        const expectedButtonTranslationString = 'notification-toastr.linked-participants.button-close';
        const expectedInHearingColor = 'white';
        const expectedNotInHearingColor = 'black';

        beforeEach(() => {
            toastrService.show.calls.reset();
            toastrService.remove.calls.reset();
            translateServiceSpy.instant.calls.reset();
            mockToast = {
                toastId: expectedToastId,
                toastRef: {
                    componentInstance: {}
                }
            } as ActiveToast<VhToastComponent>;
        });

        it('should call toastr.show with the correct parameters', () => {
            // Act
            service.createConsultationNotificationToast(expectedMessage, true);

            // Assert
            expect(toastrService.show).toHaveBeenCalledOnceWith('', '', {
                timeOut: 120000,
                extendedTimeOut: 0,
                toastClass: 'vh-no-pointer',
                tapToDismiss: false,
                toastComponent: VhToastComponent
            });
        });

        it('should have a button to close the toast', () => {
            // Arrange
            const expectedHoverColor = 'red';
            toastrService.show.and.returnValue(mockToast);

            // Act
            const toastComponentInstance = service.createConsultationNotificationToast(expectedMessage, true);

            // Assert
            expect(toastComponentInstance.vhToastOptions.buttons.length).toBe(1);
            expect(toastComponentInstance.vhToastOptions.buttons[0]).toBeTruthy();
            expect(toastComponentInstance.vhToastOptions.buttons[0].hoverColour).toBe(expectedHoverColor);
            expect(toastComponentInstance.vhToastOptions.buttons[0].label).toBe(expectedButtonTranslationString);
            expect(translateServiceSpy.instant).toHaveBeenCalledWith(expectedButtonTranslationString);
        });

        it('should call toastr.remove with the toast id when the button action is triggered', () => {
            // Arrange
            toastrService.show.and.returnValue(mockToast);

            const toastComponentInstance = service.createConsultationNotificationToast(expectedMessage, true);
            const button = toastComponentInstance.vhToastOptions.buttons[0];

            // Act
            button.action();

            // Assert
            expect(toastrService.remove).toHaveBeenCalledOnceWith(expectedToastId);
        });

        it('should call toastr.remove with the toast id when the NO action is triggered', () => {
            // Arrange
            toastrService.show.and.returnValue(mockToast);
            const toastComponentInstance = service.createConsultationNotificationToast(expectedMessage, true);

            // Act
            toastComponentInstance.vhToastOptions.onNoAction();

            // Assert
            expect(toastrService.remove).toHaveBeenCalledOnceWith(expectedToastId);
        });

        it('should set the body to the message', () => {
            // Act
            const toastComponentInstance = service.createConsultationNotificationToast(expectedMessage, true);

            // Assert
            expect(toastComponentInstance.vhToastOptions.htmlBody).toBe(expectedMessage);
        });

        it('should have the color black when NOT in hearing', () => {
            // Act
            const toastComponentInstance = service.createConsultationNotificationToast(expectedMessage, false);

            // Assert
            expect(toastComponentInstance.vhToastOptions.color).toBe(expectedNotInHearingColor);
        });

        it('should have the color white when in hearing', () => {
            // Act
            const toastComponentInstance = service.createConsultationNotificationToast(expectedMessage, true);

            // Assert
            expect(toastComponentInstance.vhToastOptions.color).toBe(expectedInHearingColor);
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

    describe('showParticipantAdded', () => {
        let mockToast: ActiveToast<VhToastComponent>;
        const expectedToastId = 2;
        const testParticipant = new ParticipantResponse();
        testParticipant.display_name = 'TestParticipantDisplayName';
        testParticipant.hearing_role = 'TestParticipantHearingRole';
        testParticipant.role = Role.Individual;

        const translatedNameMessage = 'TranslatedNameMessage';
        const translatedRoleMessage = 'TranslatedRoleMessage';
        const translatedHearingRole = 'TranslatedHearingRole';
        const translatedRole = 'TranslatedRole';

        const expectedButtonTranslationString = 'notification-toastr.participant-added.dismiss';
        const expectedInHearingColor = 'white';
        const expectedNotInHearingColor = 'black';

        beforeEach(() => {
            toastrService.show.calls.reset();
            toastrService.remove.calls.reset();
            translateServiceSpy.instant.calls.reset();
            mockToast = {
                toastId: expectedToastId,
                toastRef: {
                    componentInstance: {}
                }
            } as ActiveToast<VhToastComponent>;

            translateServiceSpy.instant
                .withArgs('notification-toastr.participant-added.message', jasmine.any(Object))
                .and.returnValue(translatedRoleMessage);

            translateServiceSpy.instant
                .withArgs('notification-toastr.participant-added.title', {
                    name: testParticipant.name
                })
                .and.returnValue(translatedNameMessage);

            translateServiceSpy.instant.withArgs(jasmine.stringMatching(/^hearing-role./)).and.returnValue(translatedHearingRole);
            translateServiceSpy.instant.withArgs(jasmine.stringMatching(/^case-role./)).and.returnValue(translatedRole);
        });

        it('should call toastr.show with the correct parameters', () => {
            toastrService.show.and.returnValue(mockToast);

            // Act
            service.showParticipantAdded(testParticipant, true);

            // Assert
            expect(toastrService.show).toHaveBeenCalledOnceWith('', '', {
                timeOut: 0,
                tapToDismiss: false,
                toastComponent: VhToastComponent
            });
        });

        it('should have a button to close the toast', () => {
            // Arrange
            const expectedHoverColor = 'green';
            toastrService.show.and.returnValue(mockToast);

            // Act
            const toastComponentInstance = service.showParticipantAdded(testParticipant, true);

            // Assert
            expect(toastComponentInstance.vhToastOptions.buttons.length).toBe(1);
            expect(toastComponentInstance.vhToastOptions.buttons[0]).toBeTruthy();
            expect(toastComponentInstance.vhToastOptions.buttons[0].hoverColour).toBe(expectedHoverColor);
            expect(toastComponentInstance.vhToastOptions.buttons[0].label).toBe(expectedButtonTranslationString);
            expect(translateServiceSpy.instant).toHaveBeenCalledWith(expectedButtonTranslationString);
        });

        it('should call toastr.remove with the toast id when the button action is triggered', () => {
            // Arrange
            toastrService.show.and.returnValue(mockToast);

            const toastComponentInstance = service.showParticipantAdded(testParticipant, true);
            const button = toastComponentInstance.vhToastOptions.buttons[0];

            // Act
            button.action();

            // Assert
            expect(toastrService.remove).toHaveBeenCalledOnceWith(expectedToastId);
        });

        it('should NOT call toastr.remove with the toast id when the NO action is triggered', () => {
            // Arrange
            toastrService.show.and.returnValue(mockToast);
            const toastComponentInstance = service.showParticipantAdded(testParticipant, true);

            // Act
            toastComponentInstance.vhToastOptions.onNoAction();

            // Assert
            expect(toastrService.remove).not.toHaveBeenCalled();
        });

        it('should set the role message with correct values', () => {
            // Act
            service.showParticipantAdded(testParticipant, true);

            // Assert
            expect(translateServiceSpy.instant).toHaveBeenCalledWith(jasmine.stringMatching(/^hearing-role./));
            expect(translateServiceSpy.instant).toHaveBeenCalledWith(jasmine.stringMatching(/^case-role./));
            expect(translateServiceSpy.instant).toHaveBeenCalledWith('notification-toastr.participant-added.message', {
                role: translatedHearingRole,
                party: translatedRole
            });
        });

        it('should set the body to the message', () => {
            // Act
            const toastComponentInstance = service.showParticipantAdded(testParticipant, true);

            // Assert
            expect(toastComponentInstance.vhToastOptions.htmlBody).toContain(translatedNameMessage);
            expect(toastComponentInstance.vhToastOptions.htmlBody).toContain(translatedRoleMessage);
        });

        it('should have the color black when NOT in hearing', () => {
            // Act
            const toastComponentInstance = service.showParticipantAdded(testParticipant, false);

            // Assert
            expect(toastComponentInstance.vhToastOptions.color).toBe(expectedNotInHearingColor);
        });

        it('should have the color white when in hearing', () => {
            // Act
            const toastComponentInstance = service.showParticipantAdded(testParticipant, true);

            // Assert
            expect(toastComponentInstance.vhToastOptions.color).toBe(expectedInHearingColor);
        });
    });
});
