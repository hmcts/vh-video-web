import { ActiveToast } from 'ngx-toastr';
import {
    ConferenceResponse,
    ConsultationAnswer,
    EndpointStatus,
    ParticipantResponse,
    VideoEndpointResponse
} from 'src/app/services/clients/api-client';
import { Logger } from 'src/app/services/logging/logger-base';
import { VhToastComponent } from 'src/app/shared/toast/vh-toast.component';
import {
    consultationService,
    globalConference,
    globalParticipant,
    globalWitness,
    globalEndpoint,
    notificationSoundsService,
    toastrService,
    initAllWRDependencies,
    mockConferenceStore
} from '../waiting-room-shared/tests/waiting-room-base-setup';
import { NotificationToastrService } from './notification-toastr.service';
import { ConsultationInvitation } from './consultation-invitation.service';
import { TranslateService } from '@ngx-translate/core';
import { Guid } from 'guid-typescript';
import { HeartbeatHealth, ParticipantHeartbeat } from '../../services/models/participant-heartbeat';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { mapEndpointToVHEndpoint, mapParticipantToVHParticipant } from '../store/models/api-contract-to-state-model-mappers';
import { UpdatedAllocation } from 'src/app/shared/models/update-allocation-dto';
import { VideoCallHostActions } from '../store/actions/video-call-host.actions';
import { VHParticipant } from '../store/models/vh-conference';
import { fakeAsync, flush } from '@angular/core/testing';

describe('NotificationToastrService', () => {
    let service: NotificationToastrService;
    let logger: jasmine.SpyObj<Logger>;
    let roomLabel: string;
    let translateServiceSpy: jasmine.SpyObj<TranslateService>;

    const testConference = new ConferenceTestData().getConferenceDetailNow();

    beforeAll(() => {
        initAllWRDependencies();
    });

    afterAll(() => {
        mockConferenceStore.resetSelectors();
    });

    beforeEach(() => {
        translateServiceSpy = jasmine.createSpyObj<TranslateService>('TranslateService', ['instant']);
        translateServiceSpy.instant.and.callFake(k => k);

        logger = jasmine.createSpyObj<Logger>('Logger', ['info', 'debug']);
        service = new NotificationToastrService(
            logger,
            toastrService,
            consultationService,
            notificationSoundsService,
            translateServiceSpy,
            mockConferenceStore
        );
        roomLabel = 'Meeting room 1';
        consultationService.respondToConsultationRequest.calls.reset();
        notificationSoundsService.playConsultationRequestRingtone.calls.reset();
        notificationSoundsService.stopConsultationRequestRingtone.calls.reset();
    });

    it('should create', () => {
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

        it('should remove any active rejected by linked participant toasts for the invite key', () => {
            // Arrange
            const expectedInviteKey = 'invite-key';
            const participant = mapParticipantToVHParticipant(globalParticipant);
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

        it('should only show invite for room once', () => {
            // Arrange
            const mockToast = {
                toastRef: {
                    componentInstance: {}
                }
            } as ActiveToast<VhToastComponent>;
            toastrService.show.and.returnValue(mockToast);
            const p = mapParticipantToVHParticipant(globalParticipant);

            // Act
            service.showConsultationInvite(roomLabel, globalConference.id, invitation, p, p, [p], [], false);
            service.showConsultationInvite(roomLabel, globalConference.id, invitation, p, p, [p], [], false);
            service.showConsultationInvite(roomLabel, globalConference.id, invitation, p, p, [p], [], false);

            // Assert
            expect(notificationSoundsService.playConsultationRequestRingtone).toHaveBeenCalledTimes(1);
        });

        it('should allow another invite after responded', () => {
            // Arrange
            const mockToast = {
                toastRef: {
                    componentInstance: {}
                }
            } as ActiveToast<VhToastComponent>;
            toastrService.show.and.returnValue(mockToast);
            toastrService.toasts = [mockToast];
            const p = mapParticipantToVHParticipant(globalParticipant);

            // Act
            service.showConsultationInvite(roomLabel, globalConference.id, invitation, p, p, [p], [], false);
            mockToast.toastRef.componentInstance.vhToastOptions.onNoAction();
            service.showConsultationInvite(roomLabel, globalConference.id, invitation, p, p, [p], [], false);
            mockToast.toastRef.componentInstance.vhToastOptions.onNoAction();
            service.showConsultationInvite(roomLabel, globalConference.id, invitation, p, p, [p], [], false);

            // Assert
            expect(notificationSoundsService.playConsultationRequestRingtone).toHaveBeenCalledTimes(3);
        });

        it('should play notification ringtone if not in conference', () => {
            // Arrange
            const mockToast = {
                toastRef: {
                    componentInstance: {}
                }
            } as ActiveToast<VhToastComponent>;
            toastrService.show.and.returnValue(mockToast);
            const p = mapParticipantToVHParticipant(globalParticipant);

            // Act
            service.showConsultationInvite(roomLabel, globalConference.id, invitation, p, p, [p], [], false);

            // Assert
            expect(notificationSoundsService.playConsultationRequestRingtone).toHaveBeenCalledTimes(1);
        });

        it('should not play notification ringtone if in conference', () => {
            // Arrange
            const mockToast = {
                toastRef: {
                    componentInstance: {}
                }
            } as ActiveToast<VhToastComponent>;
            toastrService.show.and.returnValue(mockToast);
            const p = mapParticipantToVHParticipant(globalParticipant);

            // Act
            service.showConsultationInvite(roomLabel, globalConference.id, invitation, p, p, [p], [], true);

            // Assert
            expect(notificationSoundsService.playConsultationRequestRingtone).toHaveBeenCalledTimes(0);
        });

        it('should set colour to white if in conference', () => {
            // Arrange
            const mockToast = {
                toastRef: {
                    componentInstance: {}
                }
            } as ActiveToast<VhToastComponent>;
            toastrService.show.and.returnValue(mockToast);
            const p = mapParticipantToVHParticipant(globalParticipant);

            // Act
            service.showConsultationInvite(roomLabel, globalConference.id, invitation, p, p, [p], [], true);

            // Assert
            expect(mockToast.toastRef.componentInstance.vhToastOptions.color).toBe('white');
        });

        it('should set colour to black if not in conference', () => {
            // Arrange
            const mockToast = {
                toastRef: {
                    componentInstance: {}
                }
            } as ActiveToast<VhToastComponent>;
            toastrService.show.and.returnValue(mockToast);
            const p = mapParticipantToVHParticipant(globalParticipant);

            // Act
            service.showConsultationInvite(roomLabel, globalConference.id, invitation, p, p, [p], [], false);

            // Assert
            expect(mockToast.toastRef.componentInstance.vhToastOptions.color).toBe('black');
        });

        it('should respond to consultation request on toastr on NO action', () => {
            // Arrange
            const mockToast = {
                toastRef: {
                    componentInstance: {}
                }
            } as ActiveToast<VhToastComponent>;
            toastrService.show.and.returnValue(mockToast);
            toastrService.toasts = [mockToast];
            const p = mapParticipantToVHParticipant(globalParticipant);

            // Act
            service.showConsultationInvite(roomLabel, globalConference.id, invitation, p, p, [p], [], false);
            mockToast.toastRef.componentInstance.vhToastOptions.onNoAction();

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

        it('should respond stop the sound playing and clear toasts on remove action', () => {
            // Arrange
            const mockToast = {
                toastRef: {
                    componentInstance: {}
                }
            } as ActiveToast<VhToastComponent>;
            toastrService.show.and.returnValue(mockToast);
            toastrService.toasts = [mockToast];
            const p = mapParticipantToVHParticipant(globalParticipant);

            // Act
            service.showConsultationInvite(roomLabel, globalConference.id, invitation, p, p, [p], [], false);
            mockToast.toastRef.componentInstance.vhToastOptions.onRemove();

            // Assert
            expect(notificationSoundsService.stopConsultationRequestRingtone).toHaveBeenCalledTimes(1);
        });

        it('should join participants display names - no endpoints', () => {
            // Arrange
            const mockToast = {
                toastRef: {
                    componentInstance: {}
                }
            } as ActiveToast<VhToastComponent>;
            toastrService.show.and.returnValue(mockToast);
            toastrService.toasts = [mockToast];
            const p = mapParticipantToVHParticipant(globalParticipant);
            const p2 = mapParticipantToVHParticipant(globalWitness);

            // Act
            service.showConsultationInvite(roomLabel, globalConference.id, invitation, p, p, [p2], [], false);

            // Assert
            expect(mockToast.toastRef.componentInstance.vhToastOptions.htmlBody).toBe(
                `<span class="govuk-!-font-weight-bold">notification-toastr.invite.call-from</span><br/>notification-toastr.invite.with<br/>${p2.displayName}`
            );
        });

        it('should join participants display names - participants and endpoints', () => {
            // Arrange
            const mockToast = {
                toastRef: {
                    componentInstance: {}
                }
            } as ActiveToast<VhToastComponent>;
            toastrService.show.and.returnValue(mockToast);
            toastrService.toasts = [mockToast];
            const p = mapParticipantToVHParticipant(globalParticipant);
            const p2 = mapParticipantToVHParticipant(globalWitness);
            const endpoint = mapEndpointToVHEndpoint(globalEndpoint);

            // Act
            service.showConsultationInvite(roomLabel, globalConference.id, invitation, p, p, [p, p2], [endpoint], false);

            // Assert
            expect(mockToast.toastRef.componentInstance.vhToastOptions.htmlBody).toBe(
                '<span class="govuk-!-font-weight-bold">notification-toastr.invite.call-from</span><br/>notification-toastr.invite.with<br/>Chris Witness<br/>DispName1'
            );
        });

        it('should join participants display names - single participant', () => {
            // Arrange
            const mockToast = {
                toastRef: {
                    componentInstance: {}
                }
            } as ActiveToast<VhToastComponent>;
            toastrService.show.and.returnValue(mockToast);
            toastrService.toasts = [mockToast];
            const p = mapParticipantToVHParticipant(globalParticipant);

            // Act
            service.showConsultationInvite(roomLabel, globalConference.id, invitation, p, p, [p], [], false);

            // Assert
            expect(mockToast.toastRef.componentInstance.vhToastOptions.htmlBody).toBe(
                '<span class="govuk-!-font-weight-bold">notification-toastr.invite.call-from</span>'
            );
        });

        it('should add accept button', fakeAsync(() => {
            // Arrange
            const mockToast = {
                toastId: 2,
                toastRef: {
                    componentInstance: {}
                }
            } as ActiveToast<VhToastComponent>;
            toastrService.show.and.returnValue(mockToast);
            toastrService.toasts = [mockToast];
            const p = mapParticipantToVHParticipant(globalParticipant);
            const btnId = 'notification-toastr-invite-accept';

            // Act
            service.showConsultationInvite(roomLabel, globalConference.id, invitation, p, p, [p], [], false);
            mockToast.toastRef.componentInstance.vhToastOptions.buttons[0].action();
            flush();

            // Assert
            expect(mockToast.toastRef.componentInstance.vhToastOptions.buttons[0].id).toBe(btnId);
            expect(mockToast.toastRef.componentInstance.vhToastOptions.buttons[0].cssClass).toBe('green');
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
        }));

        it('should add decline button', fakeAsync(() => {
            // Arrange
            const mockToast = {
                toastId: 2,
                toastRef: {
                    componentInstance: {}
                }
            } as ActiveToast<VhToastComponent>;
            toastrService.show.and.returnValue(mockToast);
            toastrService.toasts = [mockToast];
            const p = mapParticipantToVHParticipant(globalParticipant);
            const btnId = 'notification-toastr-invite-decline';

            // Act
            service.showConsultationInvite(roomLabel, globalConference.id, invitation, p, p, [p], [], false);
            mockToast.toastRef.componentInstance.vhToastOptions.buttons[1].action();
            flush();

            // Assert
            expect(mockToast.toastRef.componentInstance.vhToastOptions.buttons[1].id).toBe(btnId);
            expect(mockToast.toastRef.componentInstance.vhToastOptions.buttons[1].cssClass).toBe('red');
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
        }));

        it('should set correct toastr properties', () => {
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
            const p = mapParticipantToVHParticipant(globalParticipant);

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

    describe('showAudioRecordingErrorRestart', () => {
        it('should return the audio alert component, then close with the conclude', fakeAsync(() => {
            const mockToast = {
                toastRef: {
                    componentInstance: {}
                }
            } as ActiveToast<VhToastComponent>;
            toastrService.show.and.returnValue(mockToast);
            const callback = jasmine.createSpy();

            const result = service.showAudioRecordingErrorWithRestart(callback);

            expect(result).toBeDefined();

            expect(result.vhToastOptions.htmlBody).toContain('audio-alert-with-restart.message');

            result.vhToastOptions.buttons[0].action();
            flush();

            expect(callback).toHaveBeenCalled();
        }));
    });

    describe('showAudioRecordingRestartSuccess', () => {
        it('should return the audio restart success component', () => {
            const mockToast = {
                toastRef: {
                    componentInstance: {}
                }
            } as ActiveToast<VhToastComponent>;
            toastrService.show.and.returnValue(mockToast);

            const result = service.showAudioRecordingRestartSuccess();

            expect(result).toBeDefined();
            expect(result.vhToastOptions.htmlBody).toContain('audio-alert-restart-success.message');
        });
    });

    describe('showAudioRecordingRestartFailure', () => {
        it('should return the restart audio recording failure', () => {
            const mockToast = {
                toastRef: {
                    componentInstance: {}
                }
            } as ActiveToast<VhToastComponent>;
            toastrService.show.and.returnValue(mockToast);

            const result = service.showAudioRecordingRestartFailure();

            expect(result).toBeDefined();
            expect(result.vhToastOptions.htmlBody).toContain('audio-alert-restart-failure.message');
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
            const btnId = 'notification-toastr-create-consultation-notification-close';

            // Act
            const toastComponentInstance = service.createConsultationNotificationToast(expectedMessage, true);

            // Assert
            expect(toastComponentInstance.vhToastOptions.buttons.length).toBe(1);
            expect(toastComponentInstance.vhToastOptions.buttons[0]).toBeTruthy();
            expect(toastComponentInstance.vhToastOptions.buttons[0].id).toBe(btnId);
            expect(toastComponentInstance.vhToastOptions.buttons[0].cssClass).toBe(expectedHoverColor);
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

    it('show poor connection should only show once in 2 min', () => {
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

    it('should collect poor connection event count until it is reached  2 min limit', () => {
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
        const testParticipant = {
            id: '123',
            name: 'A Name',
            displayName: 'TestParticipantDisplayName',
            hearingRole: 'TestParticipantHearingRole'
        } as VHParticipant;

        const translatedNameMessage = 'TranslatedNameMessage';
        const translatedHearingRole = 'TranslatedHearingRole';
        const translatedCaseTypeGroup = 'TranslatedCaseTypeGroup';

        const translatedMessage = 'TranslatedMessage';

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
                .and.returnValue(translatedMessage);

            translateServiceSpy.instant
                .withArgs('notification-toastr.participant-added.title', {
                    name: testParticipant.name
                })
                .and.returnValue(translatedNameMessage);

            translateServiceSpy.instant.withArgs(jasmine.stringMatching(/^hearing-role./)).and.returnValue(translatedHearingRole);
            translateServiceSpy.instant.withArgs(jasmine.stringMatching(/^case-type-group./)).and.returnValue(translatedCaseTypeGroup);
        });

        it('should call toastr.show with the correct parameters', () => {
            toastrService.show.and.returnValue(mockToast);

            // Act
            service.showParticipantAdded(testParticipant, true);

            // Assert
            expect(toastrService.show).toHaveBeenCalledOnceWith('', '', {
                timeOut: 0,
                extendedTimeOut: 0,
                tapToDismiss: false,
                toastComponent: VhToastComponent
            });
        });

        it('should have a button to close the toast', () => {
            // Arrange
            const expectedHoverColor = 'green';
            toastrService.show.and.returnValue(mockToast);
            const btnId = 'notification-toastr-participant-added-dismiss';

            // Act
            const toastComponentInstance = service.showParticipantAdded(testParticipant, true);

            // Assert
            expect(toastComponentInstance.vhToastOptions.buttons.length).toBe(1);
            expect(toastComponentInstance.vhToastOptions.buttons[0]).toBeTruthy();
            expect(toastComponentInstance.vhToastOptions.buttons[0].id).toBe(btnId);
            expect(toastComponentInstance.vhToastOptions.buttons[0].cssClass).toBe(expectedHoverColor);
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

        it(' should set the role message with correct values', () => {
            // Act
            const toastComponentInstance = service.showParticipantAdded(testParticipant, true);

            // Assert
            expect(translateServiceSpy.instant).toHaveBeenCalledWith(jasmine.stringMatching(/^hearing-role./));
            expect(translateServiceSpy.instant).toHaveBeenCalledWith('notification-toastr.participant-added.message', {
                role: translatedHearingRole
            });
            expect(toastComponentInstance.vhToastOptions.htmlBody).toContain(translatedNameMessage);
            expect(toastComponentInstance.vhToastOptions.htmlBody).toContain(translatedMessage);
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

    describe('showParticipantLeftHearingRoom', () => {
        let mockToast: ActiveToast<VhToastComponent>;
        const testData = new ConferenceTestData();

        const translatedTitle = 'Participant left';
        const translatedMessageSuffix = ' left the hearing room';

        beforeEach(() => {
            toastrService.show.calls.reset();
            toastrService.remove.calls.reset();
            mockToast = {
                toastId: 999,
                toastRef: {
                    componentInstance: {}
                }
            } as ActiveToast<VhToastComponent>;

            translateServiceSpy.instant
                .withArgs('notification-toastr.participant-left-hearing.title', jasmine.any(Object))
                .and.returnValue(translatedTitle);

            toastrService.show.and.returnValue(mockToast);
        });

        it('should display the correct message with white background when video is on', () => {
            // Arrange
            const participant = testData.getListOfParticipantDetails()[0];
            const vhParticipant = mapParticipantToVHParticipant(participant);

            translateServiceSpy.instant
                .withArgs('notification-toastr.participant-left-hearing.message', jasmine.any(Object))
                .and.returnValue(`${vhParticipant.name}${translatedMessageSuffix}`);

            // Act
            const toast = service.showParticipantLeftHearingRoom(vhParticipant, true);

            // Assert
            expect(toastrService.show).toHaveBeenCalledOnceWith('', '', {
                timeOut: 0,
                extendedTimeOut: 0,
                tapToDismiss: false,
                toastComponent: VhToastComponent
            });
            expect(toast.vhToastOptions.color).toBe('white');
            expect(toast.vhToastOptions.htmlBody).toContain(`${vhParticipant.name}${translatedMessageSuffix}`);

            toast.vhToastOptions.buttons[0].action();
            expect(toastrService.remove).toHaveBeenCalledOnceWith(mockToast.toastId);
        });

        it('should display the correct message with black background when video is off', () => {
            // Arrange
            const participant = testData.getListOfParticipantDetails()[0];
            const vhParticipant = mapParticipantToVHParticipant(participant);

            translateServiceSpy.instant
                .withArgs('notification-toastr.participant-left-hearing.message', jasmine.any(Object))
                .and.returnValue(`${vhParticipant.name}${translatedMessageSuffix}`);

            // Act
            const toast = service.showParticipantLeftHearingRoom(vhParticipant, false);

            // Assert
            expect(toastrService.show).toHaveBeenCalledOnceWith('', '', {
                timeOut: 0,
                extendedTimeOut: 0,
                tapToDismiss: false,
                toastComponent: VhToastComponent
            });
            expect(toast.vhToastOptions.color).toBe('black');
            expect(toast.vhToastOptions.htmlBody).toContain(`${vhParticipant.name}${translatedMessageSuffix}`);
        });

        it('should use the display name when participant name is not set (QL only)', () => {
            // Arrange
            const participant = testData.getListOfParticipantDetails()[0];
            participant.name = undefined;
            const vhParticipant = mapParticipantToVHParticipant(participant);

            translateServiceSpy.instant
                .withArgs('notification-toastr.participant-left-hearing.message', jasmine.any(Object))
                .and.returnValue(`${vhParticipant.displayName}${translatedMessageSuffix}`);

            // Act
            const toast = service.showParticipantLeftHearingRoom(vhParticipant, true);

            // Assert
            expect(toastrService.show).toHaveBeenCalledOnceWith('', '', {
                timeOut: 0,
                extendedTimeOut: 0,
                tapToDismiss: false,
                toastComponent: VhToastComponent
            });
            expect(toast.vhToastOptions.color).toBe('white');
            expect(toast.vhToastOptions.htmlBody).toContain(`${vhParticipant.displayName}${translatedMessageSuffix}`);
        });
    });

    describe('endpoint notifications', () => {
        let mockToast: ActiveToast<VhToastComponent>;
        const expectedToastId = 2;
        const testAddEndpointResponse = new VideoEndpointResponse();
        testAddEndpointResponse.display_name = 'TestAddEndpointDisplayName';
        testAddEndpointResponse.participants_linked = ['TestAddAdvocateUserName@gmail.com'];
        testAddEndpointResponse.status = EndpointStatus.NotYetJoined;
        const testAddEndpoint = mapEndpointToVHEndpoint(testAddEndpointResponse);

        const testUpdateEndpointReponse = new VideoEndpointResponse();
        testUpdateEndpointReponse.display_name = 'TestUpdateEndpointDisplayName';
        testUpdateEndpointReponse.participants_linked = ['TestUpdateAdvocateUserName@gmail.com'];
        testAddEndpointResponse.status = EndpointStatus.NotYetJoined;
        const testUpdateEndpoint = mapEndpointToVHEndpoint(testUpdateEndpointReponse);

        const translatedMessageAddedEndpoint = 'TranslatedMessageAddedEndpoint';
        const translatedMessageUpdatedEndpoint = 'TranslatedMessageUpdatedEndpoint';
        const translatedNameMessage = 'TranslatedNameMessage';

        const expectedEndpointAddedButtonTranslationString = 'notification-toastr.endpoint-added.dismiss';
        const expectedEndpointUpdatedButtonTranslationString = 'notification-toastr.endpoint-updated.dismiss';
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
                .withArgs('notification-toastr.endpoint-added.message', jasmine.any(Object))
                .and.returnValue(translatedMessageAddedEndpoint);

            translateServiceSpy.instant
                .withArgs('notification-toastr.endpoint-updated.message', jasmine.any(Object))
                .and.returnValue(translatedMessageUpdatedEndpoint);

            translateServiceSpy.instant
                .withArgs('notification-toastr.endpoint-added.title', {
                    name: testAddEndpoint.displayName
                })
                .and.returnValue(translatedNameMessage);

            translateServiceSpy.instant
                .withArgs('notification-toastr.endpoint-updated.title', {
                    name: testUpdateEndpoint.displayName
                })
                .and.returnValue(translatedNameMessage);
        });

        describe('showEndpointAdded', () => {
            it('add should call toastr.show with the correct parameters when in hearing', () => {
                toastrService.show.and.returnValue(mockToast);

                // Act
                service.showEndpointAdded(testAddEndpoint, true);

                // Assert
                expect(toastrService.show).toHaveBeenCalledOnceWith('', '', {
                    timeOut: 0,
                    extendedTimeOut: 0,
                    tapToDismiss: false,
                    toastComponent: VhToastComponent
                });
            });

            it('add should call toastr.show with the correct parameters when NOT in hearing', () => {
                toastrService.show.and.returnValue(mockToast);

                // Act
                service.showEndpointAdded(testAddEndpoint, false);

                // Assert
                expect(toastrService.show).toHaveBeenCalledOnceWith('', '', {
                    timeOut: 0,
                    extendedTimeOut: 0,
                    tapToDismiss: false,
                    toastComponent: VhToastComponent
                });
            });

            it('add should have a button to close the toast when in hearing', () => {
                // Arrange
                const expectedHoverColor = 'green';
                toastrService.show.and.returnValue(mockToast);
                const btnId = 'notification-toastr-endpoint-added-dismiss';

                // Act
                const toastComponentInstance = service.showEndpointAdded(testAddEndpoint, true);

                // Assert
                expect(toastComponentInstance.vhToastOptions.buttons.length).toBe(1);
                expect(toastComponentInstance.vhToastOptions.buttons[0]).toBeTruthy();
                expect(toastComponentInstance.vhToastOptions.buttons[0].id).toBe(btnId);
                expect(toastComponentInstance.vhToastOptions.buttons[0].cssClass).toBe(expectedHoverColor);
                expect(toastComponentInstance.vhToastOptions.buttons[0].label).toBe(expectedEndpointAddedButtonTranslationString);
                expect(translateServiceSpy.instant).toHaveBeenCalledWith(expectedEndpointAddedButtonTranslationString);
            });

            it('add should have a button to close the toast when NOT in hearing', () => {
                // Arrange
                const expectedHoverColor = 'green';
                toastrService.show.and.returnValue(mockToast);
                const btnId = 'notification-toastr-endpoint-added-dismiss';

                // Act
                const toastComponentInstance = service.showEndpointAdded(testAddEndpoint, false);

                // Assert
                expect(toastComponentInstance.vhToastOptions.buttons.length).toBe(1);
                expect(toastComponentInstance.vhToastOptions.buttons[0]).toBeTruthy();
                expect(toastComponentInstance.vhToastOptions.buttons[0].id).toBe(btnId);
                expect(toastComponentInstance.vhToastOptions.buttons[0].cssClass).toBe(expectedHoverColor);
                expect(toastComponentInstance.vhToastOptions.buttons[0].label).toBe(expectedEndpointAddedButtonTranslationString);
                expect(translateServiceSpy.instant).toHaveBeenCalledWith(expectedEndpointAddedButtonTranslationString);
            });

            it('add should call toastr.remove with the toast id when the button action is triggered when in hearing', () => {
                // Arrange
                toastrService.show.and.returnValue(mockToast);

                const toastComponentInstance = service.showEndpointAdded(testAddEndpoint, true);
                const button = toastComponentInstance.vhToastOptions.buttons[0];

                // Act
                button.action();

                // Assert
                expect(toastrService.remove).toHaveBeenCalledOnceWith(expectedToastId);
            });

            it('add should call toastr.remove with the toast id when the button action is triggered when NOT in hearing', () => {
                // Arrange
                toastrService.show.and.returnValue(mockToast);

                const toastComponentInstance = service.showEndpointAdded(testAddEndpoint, false);
                const button = toastComponentInstance.vhToastOptions.buttons[0];

                // Act
                button.action();

                // Assert
                expect(toastrService.remove).toHaveBeenCalledOnceWith(expectedToastId);
            });

            it('add should NOT call toastr.remove with the toast id when the NO action is triggered when in hearing', () => {
                // Arrange
                toastrService.show.and.returnValue(mockToast);
                const toastComponentInstance = service.showEndpointAdded(testAddEndpoint, true);

                // Act
                toastComponentInstance.vhToastOptions.onNoAction();

                // Assert
                expect(toastrService.remove).not.toHaveBeenCalled();
            });

            it('add should NOT call toastr.remove with the toast id when the NO action is triggered when NOT in hearing', () => {
                // Arrange
                toastrService.show.and.returnValue(mockToast);
                const toastComponentInstance = service.showEndpointAdded(testAddEndpoint, false);

                // Act
                toastComponentInstance.vhToastOptions.onNoAction();

                // Assert
                expect(toastrService.remove).not.toHaveBeenCalled();
            });

            it('add should have the color white when in hearing', () => {
                // Act
                const toastComponentInstance = service.showEndpointAdded(testAddEndpoint, true);

                // Assert
                expect(toastComponentInstance.vhToastOptions.color).toBe(expectedInHearingColor);
            });

            it('add should have the color black when NOT in hearing', () => {
                // Act
                const toastComponentInstance = service.showEndpointAdded(testAddEndpoint, false);

                // Assert
                expect(toastComponentInstance.vhToastOptions.color).toBe(expectedNotInHearingColor);
            });
        });

        describe('showEndpointUpdated', () => {
            it('update should call toastr.show with the correct parameters when in hearing', () => {
                toastrService.show.and.returnValue(mockToast);

                // Act
                service.showEndpointUpdated(testUpdateEndpoint, true);

                // Assert
                expect(toastrService.show).toHaveBeenCalledOnceWith('', '', {
                    timeOut: 0,
                    extendedTimeOut: 0,
                    tapToDismiss: false,
                    toastComponent: VhToastComponent
                });
            });

            it('update should call toastr.show with the correct parameters when NOT in hearing', () => {
                toastrService.show.and.returnValue(mockToast);

                // Act
                service.showEndpointUpdated(testUpdateEndpoint, false);

                // Assert
                expect(toastrService.show).toHaveBeenCalledOnceWith('', '', {
                    timeOut: 0,
                    extendedTimeOut: 0,
                    tapToDismiss: false,
                    toastComponent: VhToastComponent
                });
            });

            it('update should have a button to close the toast when in hearing', () => {
                // Arrange
                const expectedHoverColor = 'green';
                toastrService.show.and.returnValue(mockToast);
                const btnId = 'notification-toastr-endpoint-updated-dismiss';

                // Act
                const toastComponentInstance = service.showEndpointUpdated(testUpdateEndpoint, true);

                // Assert
                expect(toastComponentInstance.vhToastOptions.buttons.length).toBe(1);
                expect(toastComponentInstance.vhToastOptions.buttons[0]).toBeTruthy();
                expect(toastComponentInstance.vhToastOptions.buttons[0].id).toBe(btnId);
                expect(toastComponentInstance.vhToastOptions.buttons[0].cssClass).toBe(expectedHoverColor);
                expect(toastComponentInstance.vhToastOptions.buttons[0].label).toBe(expectedEndpointUpdatedButtonTranslationString);
                expect(translateServiceSpy.instant).toHaveBeenCalledWith(expectedEndpointUpdatedButtonTranslationString);
            });

            it('update should have a button to close the toast when NOT in hearing', () => {
                // Arrange
                const expectedHoverColor = 'green';
                toastrService.show.and.returnValue(mockToast);
                const btnId = 'notification-toastr-endpoint-updated-dismiss';

                // Act
                const toastComponentInstance = service.showEndpointUpdated(testUpdateEndpoint, false);

                // Assert
                expect(toastComponentInstance.vhToastOptions.buttons.length).toBe(1);
                expect(toastComponentInstance.vhToastOptions.buttons[0]).toBeTruthy();
                expect(toastComponentInstance.vhToastOptions.buttons[0].id).toBe(btnId);
                expect(toastComponentInstance.vhToastOptions.buttons[0].cssClass).toBe(expectedHoverColor);
                expect(toastComponentInstance.vhToastOptions.buttons[0].label).toBe(expectedEndpointUpdatedButtonTranslationString);
                expect(translateServiceSpy.instant).toHaveBeenCalledWith(expectedEndpointUpdatedButtonTranslationString);
            });

            it('update should call toastr.remove with the toast id when the button action is triggered when in hearing', () => {
                // Arrange
                toastrService.show.and.returnValue(mockToast);

                const toastComponentInstance = service.showEndpointUpdated(testUpdateEndpoint, true);
                const button = toastComponentInstance.vhToastOptions.buttons[0];

                // Act
                button.action();

                // Assert
                expect(toastrService.remove).toHaveBeenCalledOnceWith(expectedToastId);
            });

            it('update should call toastr.remove with the toast id when the button action is triggered when NOT in hearing', () => {
                // Arrange
                toastrService.show.and.returnValue(mockToast);

                const toastComponentInstance = service.showEndpointUpdated(testUpdateEndpoint, false);
                const button = toastComponentInstance.vhToastOptions.buttons[0];

                // Act
                button.action();

                // Assert
                expect(toastrService.remove).toHaveBeenCalledOnceWith(expectedToastId);
            });

            it('update should NOT call toastr.remove with the toast id when the NO action is triggered when in hearing', () => {
                // Arrange
                toastrService.show.and.returnValue(mockToast);
                const toastComponentInstance = service.showEndpointUpdated(testUpdateEndpoint, true);

                // Act
                toastComponentInstance.vhToastOptions.onNoAction();

                // Assert
                expect(toastrService.remove).not.toHaveBeenCalled();
            });

            it('update should NOT call toastr.remove with the toast id when the NO action is triggered when NOT in hearing', () => {
                // Arrange
                toastrService.show.and.returnValue(mockToast);
                const toastComponentInstance = service.showEndpointUpdated(testUpdateEndpoint, false);

                // Act
                toastComponentInstance.vhToastOptions.onNoAction();

                // Assert
                expect(toastrService.remove).not.toHaveBeenCalled();
            });

            it('update should have the color white when in hearing', () => {
                // Act
                const toastComponentInstance = service.showEndpointUpdated(testUpdateEndpoint, true);

                // Assert
                expect(toastComponentInstance.vhToastOptions.color).toBe(expectedInHearingColor);
            });

            it('update should have the color black when NOT in hearing', () => {
                // Act
                const toastComponentInstance = service.showEndpointUpdated(testUpdateEndpoint, false);

                // Assert
                expect(toastComponentInstance.vhToastOptions.color).toBe(expectedNotInHearingColor);
            });
        });

        it('should show showEndpointLinked', () => {
            toastrService.show.and.returnValue(mockToast);
            // Act
            service.showEndpointLinked('jvsEndpoint', false);
            // Assert
            expect(toastrService.show).toHaveBeenCalledOnceWith('', '', {
                timeOut: 0,
                extendedTimeOut: 0,
                tapToDismiss: false,
                toastComponent: VhToastComponent
            });
        });

        it('should show showEndpointUnlinked', () => {
            toastrService.show.and.returnValue(mockToast);
            // Act
            service.showEndpointUnlinked('jvsEndpoint', false);
            // Assert
            expect(toastrService.show).toHaveBeenCalledOnceWith('', '', {
                timeOut: 0,
                extendedTimeOut: 0,
                tapToDismiss: false,
                toastComponent: VhToastComponent
            });
        });

        it('should show showEndpointConsultationClosed', () => {
            toastrService.show.and.returnValue(mockToast);
            // Act
            service.showEndpointConsultationClosed('jvsEndpoint', false);
            // Assert
            expect(toastrService.show).toHaveBeenCalledOnceWith('', '', {
                timeOut: 0,
                extendedTimeOut: 0,
                tapToDismiss: false,
                toastComponent: VhToastComponent
            });
        });
    });

    describe('showHearingStarted', () => {
        let mockToast: ActiveToast<VhToastComponent>;
        const expectedToastId = 2;
        const testParticipant = new ParticipantResponse();
        testParticipant.display_name = 'TestParticipantDisplayName';
        const conferneceId = Guid.create();
        const expectedInHearingColor = 'white';

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
            toastrService.show.and.returnValue(mockToast);

            // Act
            service.showHearingStarted(conferneceId.toString(), testParticipant.id);

            // Assert
            expect(toastrService.show).toHaveBeenCalledOnceWith('', '', {
                timeOut: 0,
                extendedTimeOut: 0,
                tapToDismiss: false,
                toastComponent: VhToastComponent
            });
        });

        it('should have two buttons on alert toaster', () => {
            // Arrange
            toastrService.show.and.returnValue(mockToast);

            const btnJoinHearingId = 'notification-toastr-hearing-started-join-hearing';
            const expectedJoinHearingButtonCssClass = 'hearing-started-join-hearing';
            const expectedJoinHearingButtonTranslationString = 'notification-toastr.hearing-started.join-hearing';

            const btnDismissId = 'notification-toastr-hearing-started-dismiss';
            const expectedDismissCssClass = 'hearing-started-dismiss';
            const expectedDismissButtonTranslationString = 'notification-toastr.hearing-started.dismiss';

            // Act
            const toastComponentInstance = service.showHearingStarted(conferneceId.toString(), testParticipant.id);

            // Assert
            expect(toastComponentInstance.vhToastOptions.buttons.length).toBe(2);
            expect(toastComponentInstance.vhToastOptions.buttons[0]).toBeTruthy();
            expect(toastComponentInstance.vhToastOptions.buttons[0].id).toBe(btnJoinHearingId);
            expect(toastComponentInstance.vhToastOptions.buttons[0].cssClass).toBe(expectedJoinHearingButtonCssClass);
            expect(toastComponentInstance.vhToastOptions.buttons[0].label).toBe(expectedJoinHearingButtonTranslationString);
            expect(translateServiceSpy.instant).toHaveBeenCalledWith(expectedJoinHearingButtonTranslationString);

            expect(toastComponentInstance.vhToastOptions.buttons[1]).toBeTruthy();
            expect(toastComponentInstance.vhToastOptions.buttons[1].id).toBe(btnDismissId);
            expect(toastComponentInstance.vhToastOptions.buttons[1].cssClass).toBe(expectedDismissCssClass);
            expect(toastComponentInstance.vhToastOptions.buttons[1].label).toBe(expectedDismissButtonTranslationString);
            expect(translateServiceSpy.instant).toHaveBeenCalledWith(expectedDismissButtonTranslationString);
        });

        it('should call toastr.remove with the toast id when the button action is triggered', () => {
            // Arrange
            toastrService.show.and.returnValue(mockToast);

            const toastComponentInstance = service.showHearingStarted(conferneceId.toString(), testParticipant.id);
            const button = toastComponentInstance.vhToastOptions.buttons[1];

            // Act
            button.action();

            // Assert
            expect(toastrService.remove).toHaveBeenCalledOnceWith(expectedToastId);
        });

        it('should call joinHearingInSession with join hearing button action is triggered', () => {
            // Arrange
            spyOn(mockConferenceStore, 'dispatch');
            const toastComponentInstance = service.showHearingStarted(conferneceId.toString(), testParticipant.id);
            const button = toastComponentInstance.vhToastOptions.buttons[0];
            // Act
            button.action();
            // Assert
            expect(mockConferenceStore.dispatch).toHaveBeenCalledOnceWith(
                VideoCallHostActions.joinHearing({ conferenceId: conferneceId.toString(), participantId: testParticipant.id })
            );
        });

        it('should NOT call toastr.remove with the toast id when the NO action is triggered', () => {
            // Arrange
            toastrService.show.and.returnValue(mockToast);
            const toastComponentInstance = service.showHearingStarted(conferneceId.toString(), testParticipant.id);

            // Act
            toastComponentInstance.vhToastOptions.onNoAction();

            // Assert
            expect(toastrService.remove).not.toHaveBeenCalled();
        });

        it('should have white background', () => {
            // Act
            const toastComponentInstance = service.showHearingStarted(conferneceId.toString(), testParticipant.id);

            // Assert
            expect(toastComponentInstance.vhToastOptions.color).toBe(expectedInHearingColor);
        });
    });

    describe('showHearingLayoutChanged', () => {
        let mockToast: ActiveToast<VhToastComponent>;
        const expectedToastId = 2;
        const testParticipantResponse = new ParticipantResponse();
        testParticipantResponse.display_name = 'TestParticipantDisplayName';
        const testParticipant = mapParticipantToVHParticipant(testParticipantResponse);
        const translatedNameMessage = 'TranslatedNameMessage';

        const translatedMessage = 'TranslatedMessage';

        const expectedButtonTranslationString = 'notification-toastr.hearing-layout-changed.dismiss';
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
                .withArgs('notification-toastr.hearing-layout-changed.message', jasmine.any(Object))
                .and.returnValue(translatedMessage);

            translateServiceSpy.instant
                .withArgs('notification-toastr.hearing-layout-changed.title', {
                    name: testParticipant.name
                })
                .and.returnValue(translatedNameMessage);
        });

        it('should call toastr.show with the correct parameters', () => {
            toastrService.show.and.returnValue(mockToast);

            // Act
            service.showHearingLayoutchanged(testParticipant, true);

            // Assert
            expect(toastrService.show).toHaveBeenCalledOnceWith('', '', {
                timeOut: 0,
                extendedTimeOut: 0,
                tapToDismiss: false,
                toastComponent: VhToastComponent
            });
        });

        it('should have a button to close the toast', () => {
            // Arrange
            const expectedHoverColor = 'green';
            const btnId = 'notification-toastr-hearing-layout-changed-dismiss';
            toastrService.show.and.returnValue(mockToast);

            // Act
            const toastComponentInstance = service.showHearingLayoutchanged(testParticipant, true);

            // Assert
            expect(toastComponentInstance.vhToastOptions.buttons.length).toBe(1);
            expect(toastComponentInstance.vhToastOptions.buttons[0]).toBeTruthy();
            expect(toastComponentInstance.vhToastOptions.buttons[0].id).toBe(btnId);
            expect(toastComponentInstance.vhToastOptions.buttons[0].cssClass).toBe(expectedHoverColor);
            expect(toastComponentInstance.vhToastOptions.buttons[0].label).toBe(expectedButtonTranslationString);
            expect(translateServiceSpy.instant).toHaveBeenCalledWith(expectedButtonTranslationString);
        });

        it('should call toastr.remove with the toast id when the button action is triggered', () => {
            // Arrange
            toastrService.show.and.returnValue(mockToast);

            const toastComponentInstance = service.showHearingLayoutchanged(testParticipant, true);
            const button = toastComponentInstance.vhToastOptions.buttons[0];

            // Act
            button.action();

            // Assert
            expect(toastrService.remove).toHaveBeenCalledOnceWith(expectedToastId);
        });

        it('should NOT call toastr.remove with the toast id when the NO action is triggered', () => {
            // Arrange
            toastrService.show.and.returnValue(mockToast);
            const toastComponentInstance = service.showHearingLayoutchanged(testParticipant, true);

            // Act
            toastComponentInstance.vhToastOptions.onNoAction();

            // Assert
            expect(toastrService.remove).not.toHaveBeenCalled();
        });

        it('should have the color black when NOT in hearing', () => {
            // Act
            const toastComponentInstance = service.showHearingLayoutchanged(testParticipant, false);

            // Assert
            expect(toastComponentInstance.vhToastOptions.color).toBe(expectedNotInHearingColor);
        });

        it('should have the color white when in hearing', () => {
            // Act
            const toastComponentInstance = service.showHearingLayoutchanged(testParticipant, true);

            // Assert
            expect(toastComponentInstance.vhToastOptions.color).toBe(expectedInHearingColor);
        });
    });

    describe('showAllocationHearings', () => {
        let mockToast: ActiveToast<VhToastComponent>;
        const expectedToastId = 2;
        const hearingsPassed: UpdatedAllocation[] = [];
        const conf1 = new ConferenceResponse({
            ...testConference,
            scheduled_date_time: new Date(2023, 1, 1, 10, 0, 0, 0),
            case_name: 'case name 1',
            id: 'conferenceId1',
            allocated_cso_username: 'cso@email.com',
            allocated_cso: 'cso display name',
            allocated_cso_id: 'csoId'
        });
        // update display_name for judge in participants list wit 'Judge2'
        conf1.participants = conf1.participants.map(x => {
            if (x.hearing_role === 'Judge') {
                x.display_name = 'Judge1';
            }
            return x;
        });
        hearingsPassed.push({ conference: conf1 });

        const conf2 = new ConferenceResponse({
            ...testConference,
            scheduled_date_time: new Date(2023, 1, 1, 10, 0, 0, 0),
            case_name: 'case name 2',
            id: 'conferenceId2',
            allocated_cso_username: 'cso@email.com',
            allocated_cso: 'cso display name',
            allocated_cso_id: 'csoId'
        });
        // update display_name for judge in participants list wit 'Judge2'
        conf2.participants = conf2.participants.map(x => {
            if (x.hearing_role === 'Judge') {
                x.display_name = 'Judge2';
            }
            return x;
        });
        hearingsPassed.push({ conference: conf2 });

        const translatedMessageHeader = 'TranslatedMessageHeader';
        const translatedMessageClose = 'TranslatedMessageClose';

        const expectedButtonTranslationString = 'notification-toastr.linked-participants.button-close';

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

            translateServiceSpy.instant.withArgs('allocations-toastr.header', jasmine.any(Object)).and.returnValue(translatedMessageHeader);

            translateServiceSpy.instant
                .withArgs('notification-toastr.linked-participants.button-close', jasmine.any(Object))
                .and.returnValue(translatedMessageClose);
        });

        it('should call toastr.show with the correct parameters', () => {
            toastrService.show.and.returnValue(mockToast);

            // Act
            service.createAllocationNotificationToast(hearingsPassed);

            // Assert
            expect(toastrService.show).toHaveBeenCalledOnceWith('', '', {
                timeOut: 0,
                extendedTimeOut: 0,
                toastClass: 'vh-no-pointer',
                tapToDismiss: false,
                toastComponent: VhToastComponent
            });
        });

        it('should call toastr.show with the correct parameters without a judge', () => {
            toastrService.show.and.returnValue(mockToast);
            hearingsPassed[0].conference.participants = hearingsPassed[0].conference.participants.filter(x => x.hearing_role !== 'Judge');

            // Act
            service.createAllocationNotificationToast(hearingsPassed);

            // Assert
            expect(toastrService.show).toHaveBeenCalledOnceWith('', '', {
                timeOut: 0,
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
            const btnId = 'notification-toastr-create-consultation-notification-close';

            // Act
            const toastComponentInstance = service.createAllocationNotificationToast(hearingsPassed);

            // Assert
            expect(toastComponentInstance.vhToastOptions.buttons.length).toBe(1);
            expect(toastComponentInstance.vhToastOptions.buttons[0]).toBeTruthy();
            expect(toastComponentInstance.vhToastOptions.buttons[0].id).toBe(btnId);
            expect(toastComponentInstance.vhToastOptions.buttons[0].cssClass).toBe(expectedHoverColor);
            expect(toastComponentInstance.vhToastOptions.buttons[0].label).toBe(expectedButtonTranslationString);
            expect(translateServiceSpy.instant).toHaveBeenCalledWith(expectedButtonTranslationString);
        });

        it('should call toastr.remove with the toast id when the button action is triggered', () => {
            // Arrange
            toastrService.show.and.returnValue(mockToast);

            const toastComponentInstance = service.createAllocationNotificationToast(hearingsPassed);
            const button = toastComponentInstance.vhToastOptions.buttons[0];

            // Act
            button.action();

            // Assert
            expect(toastrService.remove).toHaveBeenCalledOnceWith(expectedToastId);
        });

        it('should NOT call toastr.remove with the toast id when the NO action is triggered', () => {
            // Arrange
            toastrService.show.and.returnValue(mockToast);
            const toastComponentInstance = service.createAllocationNotificationToast(hearingsPassed);

            // Act
            toastComponentInstance.vhToastOptions.onNoAction();

            // Assert
            expect(logger.debug).toHaveBeenCalled();
        });
    });
});
