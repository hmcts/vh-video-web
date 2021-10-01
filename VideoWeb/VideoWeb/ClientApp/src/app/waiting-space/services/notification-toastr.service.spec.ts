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
        service = new NotificationToastrService(logger, toastrService, notificationSoundsService, translateServiceSpy);
        roomLabel = 'Meeting room 1';
        consultationService.respondToConsultationRequest.calls.reset();
        notificationSoundsService.playConsultationRequestRingtone.calls.reset();
        notificationSoundsService.stopConsultationRequestRingtone.calls.reset();
    });

    it('should create', async () => {
        expect(service).toBeTruthy();
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
            const expectedSetColor = 'red';
            toastrService.show.and.returnValue(mockToast);

            // Act
            const toastComponentInstance = service.createConsultationNotificationToast(expectedMessage, true);

            // Assert
            expect(toastComponentInstance.vhToastOptions.buttons.length).toBe(1);
            expect(toastComponentInstance.vhToastOptions.buttons[0]).toBeTruthy();
            expect(toastComponentInstance.vhToastOptions.buttons[0].setColour).toBe(expectedSetColor);
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
        testParticipant.case_type_group = 'TestParticipantCaseTypeGroup';

        const translatedNameMessage = 'TranslatedNameMessage';
        const translatedRoleMessage = 'TranslatedRoleMessage';
        const translatedHearingRole = 'TranslatedHearingRole';
        const translatedCaseTypeGroup = 'TranslatedCaseTypeGroup';

        const translatedMessageWithParty = 'TranslatedMessageWithParty';
        const translatedMessageWithoutParty = 'TranslatedMessageWithoutParty';

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
                .withArgs('notification-toastr.participant-added.message-with-party', jasmine.any(Object))
                .and.returnValue(translatedMessageWithParty);

            translateServiceSpy.instant
                .withArgs('notification-toastr.participant-added.message-without-party', jasmine.any(Object))
                .and.returnValue(translatedMessageWithoutParty);

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
            toastrService.show.and.returnValue(mockToast);

            // Act
            const toastComponentInstance = service.showParticipantAdded(testParticipant, true);

            // Assert
            expect(toastComponentInstance.vhToastOptions.buttons.length).toBe(1);
            expect(toastComponentInstance.vhToastOptions.buttons[0]).toBeTruthy();
            expect(toastComponentInstance.vhToastOptions.dismissOnly).toBeTruthy();
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
            const toastComponentInstance = service.showParticipantAdded(testParticipant, true);

            // Assert
            expect(translateServiceSpy.instant).toHaveBeenCalledWith(jasmine.stringMatching(/^hearing-role./));
            expect(translateServiceSpy.instant).toHaveBeenCalledWith(jasmine.stringMatching(/^case-type-group./));
            expect(translateServiceSpy.instant).toHaveBeenCalledWith('notification-toastr.participant-added.message-with-party', {
                role: translatedHearingRole,
                party: translatedCaseTypeGroup
            });

            expect(toastComponentInstance.vhToastOptions.htmlBody).toContain(translatedNameMessage);
            expect(toastComponentInstance.vhToastOptions.htmlBody).toContain(translatedMessageWithParty);
        });

        it('should set the role message with correct values when no party', () => {
            // Act
            testParticipant.case_type_group = null;
            const toastComponentInstance = service.showParticipantAdded(testParticipant, true);

            // Assert
            expect(translateServiceSpy.instant).toHaveBeenCalledWith(jasmine.stringMatching(/^hearing-role./));
            expect(translateServiceSpy.instant).not.toHaveBeenCalledWith(jasmine.stringMatching(/^case-type-group./));
            expect(translateServiceSpy.instant).toHaveBeenCalledWith('notification-toastr.participant-added.message-without-party', {
                role: translatedHearingRole,
                party: null
            });

            expect(toastComponentInstance.vhToastOptions.htmlBody).toContain(translatedNameMessage);
            expect(toastComponentInstance.vhToastOptions.htmlBody).toContain(translatedMessageWithoutParty);
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
