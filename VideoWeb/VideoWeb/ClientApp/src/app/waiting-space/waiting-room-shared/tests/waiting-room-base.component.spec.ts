import { ComponentFixture, fakeAsync, flush, flushMicrotasks, TestBed, tick } from '@angular/core/testing';
import { of, Subject } from 'rxjs';
import {
    ConferenceStatus,
    ConsultationAnswer,
    LinkType,
    LoggedParticipantResponse,
    ParticipantStatus,
    Role
} from 'src/app/services/clients/api-client';
import {
    CallSetup,
    ConnectedCall,
    CallError,
    DisconnectedCall,
    Presentation,
    ConnectedPresentation,
    DisconnectedPresentation
} from '../../models/video-call-models';
import { WaitingRoomBaseDirective } from '../waiting-room-base.component';
import { WRTestComponent } from './WRTestComponent';
import { ConsultationService } from 'src/app/services/api/consultation.service';
import { ErrorService } from 'src/app/services/error.service';
import { EventsService } from 'src/app/services/events.service';
import { Logger } from 'src/app/services/logging/logger-base';
import { VideoCallService } from '../../services/video-call.service';
import { createMockStore, MockStore, provideMockStore } from '@ngrx/store/testing';
import * as ConferenceSelectors from '../../store/selectors/conference.selectors';
import { ConferenceState } from '../../store/reducers/conference.reducer';
import { mapConferenceToVHConference, mapParticipantToVHParticipant } from '../../store/models/api-contract-to-state-model-mappers';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { VHConference, VHParticipant } from '../../store/models/vh-conference';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import {
    consultationInvitiationService,
    consultationService,
    deviceTypeService,
    errorService,
    eventsService,
    initAllWRDependencies,
    launchDarklyService,
    notificationSoundsService,
    notificationToastrService,
    participantsLinked,
    roomClosingToastrService,
    router,
    titleService,
    videoCallService,
    videoWebService
} from './waiting-room-base-setup';
import { MockLogger } from 'src/app/testing/mocks/mock-logger';
import { NotificationSoundsService } from '../../services/notification-sounds.service';
import { NotificationToastrService } from '../../services/notification-toastr.service';
import { DeviceTypeService } from 'src/app/services/device-type.service';
import { RoomClosingToastrService } from '../../services/room-closing-toast.service';
import { ClockService } from 'src/app/services/clock.service';
import { ConsultationInvitation, ConsultationInvitationService } from '../../services/consultation-invitation.service';
import { Title } from '@angular/platform-browser';
import { FEATURE_FLAGS, LaunchDarklyService } from 'src/app/services/launch-darkly.service';
import { VhToastComponent } from 'src/app/shared/toast/vh-toast.component';
import { ConsultationRequestResponseMessage } from 'src/app/services/models/consultation-request-response-message';
import {
    consultationRequestResponseMessageSubjectMock,
    eventHubDisconnectSubjectMock,
    eventHubReconnectSubjectMock,
    hearingStatusSubjectMock
} from 'src/app/testing/mocks/mock-events-service';
import { Guid } from 'guid-typescript';
import { ConferenceActions } from '../../store/actions/conference.actions';
import { getSpiedPropertyGetter } from 'src/app/shared/jasmine-helpers/property-helpers';
import {
    onCallTransferredMock,
    onConnectedSubjectMock,
    onDisconnectedSubjectMock,
    onErrorSubjectMock,
    onPresentationConnectedMock,
    onPresentationDisconnectedMock,
    onPresentationMock,
    onSetupSubjectMock
} from 'src/app/testing/mocks/mock-video-call.service';
import { ConferenceStatusMessage } from 'src/app/services/models/conference-status-message';
import { HearingRole } from '../../models/hearing-role-model';
import { pageUrls } from 'src/app/shared/page-url.constants';
import { ElementRef } from '@angular/core';
import { ParticipantHelper } from 'src/app/shared/participant-helper';

describe('WaitingRoomBaseDirective', () => {
    const testData = new ConferenceTestData();
    let conference: VHConference;
    let loggedInParticipant: VHParticipant;

    let fixture: ComponentFixture<WRTestComponent>;
    let component: WaitingRoomBaseDirective;
    let mockStore: MockStore<ConferenceState>;
    let activatedRoute: ActivatedRoute;

    const mockLogger = new MockLogger();

    let mockVideoCallService = videoCallService;
    let mockEventsService = eventsService;
    let mockErrorService = errorService;
    let mockConsultationService = consultationService;
    let mockNotificationSoundsService = notificationSoundsService;
    let mockNotificationToastrService = notificationToastrService;
    let mockDeviceTypeService = deviceTypeService;
    let mockRoomClosingToastrService = roomClosingToastrService;
    let mockRouter = router;
    let mockClockService;
    const clockSubject = new Subject<Date>();
    let mockConsultationInvitiationService = consultationInvitiationService;
    let mockTitleService = titleService;
    let mockLaunchDarklyService = launchDarklyService;

    beforeAll(() => {
        initAllWRDependencies();

        conference = mapConferenceToVHConference(testData.getConferenceDetailNow());
        conference.participants = conference.participants.map(x => {
            x.status = ParticipantStatus.Available;
            return x;
        });

        // TOOD: clean up above to delcaration only since the values are only set AFTER initAllWRDependencies is called
        mockVideoCallService = videoCallService;
        mockEventsService = eventsService;
        mockErrorService = errorService;
        mockConsultationService = consultationService;
        mockNotificationSoundsService = notificationSoundsService;
        mockNotificationToastrService = notificationToastrService;
        mockDeviceTypeService = deviceTypeService;
        mockRoomClosingToastrService = roomClosingToastrService;
        mockRouter = router;
        mockClockService = jasmine.createSpyObj<ClockService>('ClockService', ['getClock']);
        mockClockService.getClock.and.returnValue(clockSubject.asObservable());
        mockConsultationInvitiationService = consultationInvitiationService;
        mockTitleService = titleService;
        mockLaunchDarklyService = launchDarklyService;
    });

    beforeEach(async () => {
        mockLaunchDarklyService.getFlag.withArgs(FEATURE_FLAGS.instantMessaging, jasmine.any(Boolean)).and.returnValue(of(true));

        loggedInParticipant = conference.participants.find(x => x.role === Role.Individual);

        const logged = new LoggedParticipantResponse({
            display_name: loggedInParticipant.displayName,
            role: loggedInParticipant.role,
            participant_id: loggedInParticipant.id
        });

        activatedRoute = <any>{
            snapshot: { data: { loggedUser: logged }, paramMap: convertToParamMap({ conferenceId: conference.id }) }
        };

        mockStore = createMockStore({
            initialState: {
                currentConference: conference,
                loggedInParticipant: loggedInParticipant,
                countdownComplete: false,
                availableRooms: []
            }
        });

        await TestBed.configureTestingModule({
            declarations: [WRTestComponent],
            providers: [
                WRTestComponent,
                { provide: ActivatedRoute, useValue: activatedRoute },
                { provide: VideoWebService, useValue: videoWebService },
                { provide: EventsService, useValue: mockEventsService },
                { provide: Logger, useValue: mockLogger },
                { provide: ErrorService, useValue: mockErrorService },
                { provide: VideoCallService, useValue: mockVideoCallService },
                { provide: ConsultationService, useValue: mockConsultationService },
                { provide: NotificationSoundsService, useValue: mockNotificationSoundsService },
                { provide: NotificationToastrService, useValue: mockNotificationToastrService },
                { provide: DeviceTypeService, useValue: mockDeviceTypeService },
                { provide: Router, useValue: mockRouter },
                { provide: RoomClosingToastrService, useValue: mockRoomClosingToastrService },
                { provide: ClockService, useValue: mockClockService },
                { provide: ConsultationInvitationService, useValue: mockConsultationInvitiationService },
                { provide: Title, useValue: mockTitleService },
                { provide: LaunchDarklyService, useValue: mockLaunchDarklyService },
                provideMockStore()
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(WRTestComponent);
        component = TestBed.inject(WRTestComponent);

        mockStore = TestBed.inject(MockStore);
        mockStore.overrideSelector(ConferenceSelectors.getActiveConference, conference);
        mockStore.overrideSelector(ConferenceSelectors.getLoggedInParticipant, loggedInParticipant);
    });

    afterEach(() => {
        component.executeWaitingRoomCleanup();
    });

    afterAll(() => {
        mockStore.resetSelectors();
    });

    describe('create', () => {
        it('verify store changes are processed', () => {
            expect(component.conferenceId).toEqual(conference.id);
            expect(component.vhParticipant.id).toEqual(loggedInParticipant.id);
            expect(component.hearing.id).toEqual(conference.id);
            expect(component.vhConference.id).toEqual(conference.id);
            component.phoneNumber$.subscribe(phoneNumber => {
                expect(phoneNumber).toEqual(component.contactDetails.englandAndWales.phoneNumber);
            });
            expect(component.getLoggedParticipant().id).toEqual(loggedInParticipant.id);

            expect(component.isTransferringIn).toBeFalse();
        });
    });

    describe('showExtraContent', () => {
        it('show return true when video is hidden and participant is not transferring in', () => {
            component.showVideo = false;
            component.isTransferringIn = false;

            const result = component.showExtraContent;

            expect(result).toBeTrue();
        });

        it('should return false when video is hidden and participant is transferring in', () => {
            component.showVideo = false;
            component.isTransferringIn = true;

            const result = component.showExtraContent;

            expect(result).toBeFalse();
        });

        it('should return false when video is shown', () => {
            component.showVideo = true;
            component.isTransferringIn = false;

            const result = component.showExtraContent;

            expect(result).toBeFalse();
        });
    });

    describe('conferenceId', () => {
        it('should return conference id', () => {
            const result = component.conferenceId;

            expect(result).toEqual(conference.id);
        });

        it('should use the param map if conference id has not been set', () => {
            component.vhConference = null;

            const result = component.conferenceId;

            expect(result).toEqual(conference.id);
        });
    });

    describe('numberOfJudgeOrJOHsInConsultation', () => {
        it('should return zero when no judge or JOHs are in consultation', () => {
            component.vhConference.participants = conference.participants.map(x => {
                x.status = ParticipantStatus.Available;
                return x;
            });

            const result = component.numberOfJudgeOrJOHsInConsultation;

            expect(result).toBe(0);
        });

        it('should return count of judge or JOHs in consultation', () => {
            const judge = conference.participants.find(x => x.role === Role.Judge);
            judge.status = ParticipantStatus.InConsultation;
            judge.room = { label: 'JudgeJoHConsultationRoom1', locked: false };

            const result = component.numberOfJudgeOrJOHsInConsultation;

            expect(result).toBe(1);
        });
    });

    describe('togglePanel', () => {
        const participantPanelName = 'Participants';
        const chatPanelName = 'Chat';

        it('should toggle panel from false to true', () => {
            // Arrange
            component.panelStates[participantPanelName] = false;
            component.panelStates[chatPanelName] = false;

            // Act
            component.togglePanel(participantPanelName);

            // Assert
            expect(component.panelStates.Participants).toBe(true);
            expect(component.panelStates.Chat).toBe(false);

            expect(component.areParticipantsVisible).toBeTrue();
        });

        it('should toggle panel from false to true and reset any existing true to false', () => {
            // Arrange
            component.panelStates[participantPanelName] = true;
            component.panelStates[chatPanelName] = false;

            // Act
            component.togglePanel(participantPanelName);

            // Assert
            expect(component.panelStates.Participants).toBe(false);
            expect(component.panelStates.Chat).toBe(false);
            expect(component.areParticipantsVisible).toBeFalse();
        });

        it('should toggle panel and chat panel should be visible', () => {
            // Arrange
            component.panelStates[participantPanelName] = true;
            component.panelStates[chatPanelName] = false;

            // Act
            component.togglePanel(chatPanelName);

            // Assert
            expect(component.panelStates.Participants).toBe(false);
            expect(component.panelStates.Chat).toBe(true);
            expect(component.areParticipantsVisible).toBeFalse();
        });
    });

    describe('isParticipantInCorrectWaitingRoomState', () => {
        it('should return true when participant is connected, available and is not linked to a room', () => {
            component.connected = true;
            component.vhParticipant.status = ParticipantStatus.Available;
            component.vhParticipant.room = null;

            const result = component.isParticipantInCorrectWaitingRoomState();

            expect(result).toBeTrue();
        });

        it('should return true when participant is connected, available and linked to the waiting room', () => {
            component.connected = true;
            component.vhParticipant.status = ParticipantStatus.Available;
            component.vhParticipant.room = { locked: false, label: 'WaitingRoom' };

            const result = component.isParticipantInCorrectWaitingRoomState();

            expect(result).toBeTrue();
        });

        it('should return false when participant is not available', () => {
            component.connected = true;
            component.vhParticipant.status = ParticipantStatus.InConsultation;

            const result = component.isParticipantInCorrectWaitingRoomState();

            expect(result).toBeFalse();
        });

        it('should return false when the participant is not connected', () => {
            component.connected = false;
            component.vhParticipant.status = ParticipantStatus.Available;

            const result = component.isParticipantInCorrectWaitingRoomState();

            expect(result).toBeFalse();
        });
    });

    describe('stringToTranslateId', () => {
        it('should translane a single word input', () => {
            const result = component.stringToTranslateId('Insolvency');
            expect(result).toBe('insolvency');
        });

        it('should translate a multiple word input', () => {
            const result = component.stringToTranslateId('Primary Health Lists');
            expect(result).toBe('primary-health-lists');
        });

        it('should translate a multiple word input with special characters', () => {
            const result = component.stringToTranslateId('MP’s Expenses');
            expect(result).toBe('mp-s-expenses');
        });
    });

    describe('getCaseNameAndNumber', () => {
        it('should return case name and number as a single string', () => {
            const result = component.getCaseNameAndNumber();

            expect(result).toBe(`${conference.caseName}: ${conference.caseNumber}`);
        });
    });

    describe('EventHub Subscriptions', () => {
        beforeEach(() => {
            component.startEventHubSubscribers();
        });

        afterEach(() => {
            component.executeWaitingRoomCleanup();
        });

        describe('onConnected', () => {
            const serviceConnected = eventHubReconnectSubjectMock;

            it('should set connected to true', () => {
                // Arrange
                const updateSpy = spyOn(component, 'updateShowVideo');
                // Act
                serviceConnected.next();

                // Assert
                expect(updateSpy).toHaveBeenCalled();
            });
        });

        describe('onDisconnected', () => {
            const eventHubDisconnectSubject = eventHubDisconnectSubjectMock;

            it('should get conference when disconnected from eventhub less than 7 times', fakeAsync(() => {
                spyOn(mockStore, 'dispatch');

                eventHubDisconnectSubject.next(1);
                eventHubDisconnectSubject.next(2);
                eventHubDisconnectSubject.next(3);
                eventHubDisconnectSubject.next(4);
                eventHubDisconnectSubject.next(5);
                eventHubDisconnectSubject.next(6);

                flushMicrotasks();

                expect(mockStore.dispatch).toHaveBeenCalledTimes(6);
                expect(mockStore.dispatch).toHaveBeenCalledWith(ConferenceActions.loadConference({ conferenceId: component.conferenceId }));
            }));
        });

        describe('onHearingStatusChange', () => {
            const hearingStatusSubject = hearingStatusSubjectMock;

            it('should reset presentation stream on change', fakeAsync(() => {
                // Arrange
                component.presentationStream = new MediaStream([]);

                const status = ConferenceStatus.InSession;
                const message = new ConferenceStatusMessage(conference.id, status);

                // Act
                hearingStatusSubject.next(message);
                tick();

                // Assert
                expect(component.presentationStream).toBeNull();
                expect(mockVideoCallService.stopScreenShare).toHaveBeenCalled();
            }));
        });
    });

    describe('consultation', () => {
        describe('onTransferingToConsultation', () => {
            const expectedConsultationRoomLabel = 'ConsultationRoom';
            it('should remove the active toast and delete the invitation from the consultation invitation service', () => {
                // Arrange

                // Act
                component.onTransferingToConsultation(expectedConsultationRoomLabel);

                // Assert
                expect(consultationInvitiationService.removeInvitation).toHaveBeenCalledOnceWith(expectedConsultationRoomLabel);
            });
        });

        describe('onConsultationRejected', () => {
            let expectedConsultationRoomLabel = 'ConsultationRoom';

            beforeEach(() => {
                consultationInvitiationService.removeInvitation.calls.reset();
            });

            it('should call removeInvitation for the room that was rejected', () => {
                // Arrange

                // Act
                component.onConsultationRejected(expectedConsultationRoomLabel);

                // Assert
                expect(consultationInvitiationService.removeInvitation).toHaveBeenCalledOnceWith(expectedConsultationRoomLabel);
            });

            describe('onLinkedParticiantAcceptedConsultationInvite', () => {
                const linkedParticipant = participantsLinked[1];
                expectedConsultationRoomLabel = 'ConsultationRoom';
                let invitation = {} as ConsultationInvitation;

                beforeEach(() => {
                    notificationToastrService.showWaitingForLinkedParticipantsToAccept.calls.reset();
                    consultationInvitiationService.getInvitation.calls.reset();

                    invitation.invitationId = 'invitation id';
                    invitation.answer = ConsultationAnswer.Accepted;
                });

                it('should NOT make any calls and should return when the invitation does NOT have an invitation id', () => {
                    // Arrange
                    invitation = {
                        invitationId: null,
                        linkedParticipantStatuses: {},
                        activeToast: null,
                        answer: ConsultationAnswer.None,
                        invitedByName: null
                    } as ConsultationInvitation;
                    invitation.invitationId = null;
                    invitation.linkedParticipantStatuses = { lp1: true, lp2: true, lp3: true, lp4: true };
                    consultationInvitiationService.getInvitation.and.returnValue(invitation);

                    spyOn(component, 'createOrUpdateWaitingOnLinkedParticipantsNotification');

                    // Act
                    component.onLinkedParticiantAcceptedConsultationInvite(expectedConsultationRoomLabel, linkedParticipant.id);

                    // Assert
                    expect(invitation.linkedParticipantStatuses[linkedParticipant.id]).toBeFalsy();
                    expect(component.createOrUpdateWaitingOnLinkedParticipantsNotification).not.toHaveBeenCalled();
                });

                it('should update the participant status and the toast notification for the invitation if there are still linked participants who havent accepted and the active participant has accepted', () => {
                    // Arrange
                    invitation.linkedParticipantStatuses = { lp1: true, lp2: true, lp3: true, lp4: true };
                    consultationInvitiationService.getInvitation.and.returnValue(invitation);

                    spyOn(component, 'createOrUpdateWaitingOnLinkedParticipantsNotification');

                    // Act
                    component.onLinkedParticiantAcceptedConsultationInvite(expectedConsultationRoomLabel, linkedParticipant.id);

                    // Assert
                    expect(consultationInvitiationService.getInvitation).toHaveBeenCalledOnceWith(expectedConsultationRoomLabel);
                    expect(invitation.linkedParticipantStatuses[linkedParticipant.id]).toBeTrue();
                    expect(component.createOrUpdateWaitingOnLinkedParticipantsNotification).toHaveBeenCalledOnceWith(invitation);
                });

                it('should NOT update the toast notification for the invitation if the active participant has NOT accepted', () => {
                    // Arrange
                    invitation.linkedParticipantStatuses = { lp1: true, lp2: true, lp3: true, lp4: true };
                    invitation.answer = ConsultationAnswer.None;
                    consultationInvitiationService.getInvitation.and.returnValue(invitation);

                    spyOn(component, 'createOrUpdateWaitingOnLinkedParticipantsNotification');

                    // Act
                    component.onLinkedParticiantAcceptedConsultationInvite(expectedConsultationRoomLabel, linkedParticipant.id);

                    // Assert
                    expect(consultationInvitiationService.getInvitation).toHaveBeenCalledOnceWith(expectedConsultationRoomLabel);
                    expect(invitation.linkedParticipantStatuses[linkedParticipant.id]).toBeTrue();
                    expect(component.createOrUpdateWaitingOnLinkedParticipantsNotification).not.toHaveBeenCalled();
                });
            });
        });

        describe('onLinkedParticiantRejectedConsultationInvite', () => {
            const linkedParticipant = mapParticipantToVHParticipant(participantsLinked[1]);
            const expectedConsultationRoomLabel = 'ConsultationRoom';
            const expectedInvitedByName = 'invited by';
            const expectedInvitationId = 'expected invitation id';
            const toastSpy = jasmine.createSpyObj<VhToastComponent>('VhToastComponent', ['remove']);
            const invitation = {
                linkedParticipantStatuses: {}
            } as ConsultationInvitation;

            beforeEach(() => {
                notificationToastrService.showConsultationRejectedByLinkedParticipant.calls.reset();
                consultationInvitiationService.getInvitation.calls.reset();
                consultationInvitiationService.linkedParticipantRejectedInvitation.calls.reset();
                toastSpy.remove.calls.reset();

                toastSpy.declinedByThirdParty = false;
                invitation.activeToast = toastSpy;
                invitation.invitedByName = expectedInvitedByName;
                invitation.invitationId = expectedInvitationId;
                consultationInvitiationService.getInvitation.and.returnValue(invitation);
            });

            it('should NOT make any calls and should return when the invitation does NOT have an invitation id', () => {
                // Arrange
                const linked = linkedParticipant;
                const expectedIsParticipantInHearing = true;
                component.vhParticipant.status = ParticipantStatus.InHearing;
                invitation.invitationId = null;

                // Act
                component.onLinkedParticiantRejectedConsultationInvite(linked, expectedConsultationRoomLabel);

                // Assert
                expect(notificationToastrService.showConsultationRejectedByLinkedParticipant).not.toHaveBeenCalled();
                expect(consultationInvitiationService.linkedParticipantRejectedInvitation).not.toHaveBeenCalled();
                expect(toastSpy.remove).not.toHaveBeenCalled();
                expect(toastSpy.declinedByThirdParty).toBeFalse();
            });

            it('should reject the invitation for a room and set the inital toast to rejectedByThirdParty to true if it exists when is in hearing', () => {
                // Arrange
                const expectedIsParticipantInHearing = true;
                component.vhParticipant.status = ParticipantStatus.InHearing;

                // Act
                component.onLinkedParticiantRejectedConsultationInvite(linkedParticipant, expectedConsultationRoomLabel);

                // Assert
                expect(notificationToastrService.showConsultationRejectedByLinkedParticipant).toHaveBeenCalledOnceWith(
                    conference.id,
                    expectedConsultationRoomLabel,
                    linkedParticipant.displayName,
                    expectedInvitedByName,
                    expectedIsParticipantInHearing
                );
                expect(consultationInvitiationService.linkedParticipantRejectedInvitation).toHaveBeenCalledOnceWith(
                    expectedConsultationRoomLabel,
                    linkedParticipant.id
                );
                expect(consultationInvitiationService.getInvitation).toHaveBeenCalledOnceWith(expectedConsultationRoomLabel);
                expect(toastSpy.remove).toHaveBeenCalledTimes(1);
                expect(toastSpy.declinedByThirdParty).toBeTrue();
            });

            it('should reject the invitation for a room and set the inital toast to rejectedByThirdParty to true if it exists when is NOT in hearing', () => {
                // Arrange
                const expectedIsParticipantInHearing = false;
                component.vhParticipant.status = ParticipantStatus.Available;

                // Act
                component.onLinkedParticiantRejectedConsultationInvite(linkedParticipant, expectedConsultationRoomLabel);

                // Assert
                expect(notificationToastrService.showConsultationRejectedByLinkedParticipant).toHaveBeenCalledOnceWith(
                    conference.id,
                    expectedConsultationRoomLabel,
                    linkedParticipant.displayName,
                    expectedInvitedByName,
                    expectedIsParticipantInHearing
                );
                expect(consultationInvitiationService.linkedParticipantRejectedInvitation).toHaveBeenCalledOnceWith(
                    expectedConsultationRoomLabel,
                    linkedParticipant.id
                );
                expect(consultationInvitiationService.getInvitation).toHaveBeenCalledOnceWith(expectedConsultationRoomLabel);
                expect(toastSpy.remove).toHaveBeenCalledTimes(1);
                expect(toastSpy.declinedByThirdParty).toBeTrue();
            });

            it('should store the rejected toast on the invitation', () => {
                // Arrange
                component.vhParticipant.status = ParticipantStatus.Available;
                const newToastSpy = jasmine.createSpyObj<VhToastComponent>('VhToastComponent', ['remove']);
                notificationToastrService.showConsultationRejectedByLinkedParticipant.and.returnValue(newToastSpy);

                // Act
                component.onLinkedParticiantRejectedConsultationInvite(linkedParticipant, expectedConsultationRoomLabel);

                // Assert
                expect(toastSpy.remove).toHaveBeenCalledTimes(1);
                expect(invitation.activeToast).toBe(newToastSpy);
            });
        });

        describe('on ConsultationRequestResponseMessage', () => {
            const primaryParticipant = mapParticipantToVHParticipant(participantsLinked[0]);
            const linkedParticipant = mapParticipantToVHParticipant(participantsLinked[1]);
            const expectedConsultationRoomLabel = 'ConsultationRoom989';
            const consultationRequestResponseMessageSubject = consultationRequestResponseMessageSubjectMock;
            const invitationId = Guid.create().toString();

            beforeEach(() => {
                component.startEventHubSubscribers();
            });

            afterEach(() => {
                component.executeWaitingRoomCleanup();
                component.vhParticipant = loggedInParticipant;
            });

            it('should call onConsultationRejected when the active participant rejects the invitation', fakeAsync(() => {
                // Arrange
                const message = new ConsultationRequestResponseMessage(
                    conference.id,
                    invitationId,
                    expectedConsultationRoomLabel,
                    loggedInParticipant.id,
                    ConsultationAnswer.Rejected,
                    loggedInParticipant.id
                );

                const invitation = {
                    invitationId: invitationId,
                    linkedParticipantStatuses: {},
                    activeToast: null,
                    answer: ConsultationAnswer.None,
                    invitedByName: null
                } as ConsultationInvitation;

                mockConsultationInvitiationService.getInvitation.withArgs(expectedConsultationRoomLabel).and.returnValue(invitation);

                spyOn(component, 'onConsultationRejected');
                component.vhParticipant = loggedInParticipant;

                // Act
                consultationRequestResponseMessageSubject.next(message);
                flush();

                // Assert
                expect(component.onConsultationRejected).toHaveBeenCalledOnceWith(expectedConsultationRoomLabel);
            }));

            it('should NOT raise any toasts if the request was not raised directly by the linked participants client', fakeAsync(() => {
                // Arrange
                const message = new ConsultationRequestResponseMessage(
                    conference.id,
                    invitationId,
                    expectedConsultationRoomLabel,
                    linkedParticipant.id,
                    ConsultationAnswer.Rejected,
                    loggedInParticipant.id
                );

                component['findParticipant'] = jasmine.createSpy('findParticipant').and.returnValue(linkedParticipant);
                spyOn(component, 'onConsultationAccepted');
                spyOn(component, 'onLinkedParticiantRejectedConsultationInvite');
                component.vhParticipant = primaryParticipant;

                // Act
                consultationRequestResponseMessageSubject.next(message);
                flush();

                // Assert
                expect(component.onConsultationAccepted).not.toHaveBeenCalled();
                expect(component.onLinkedParticiantRejectedConsultationInvite).not.toHaveBeenCalled();
            }));

            it('should NOT raise any toasts if the participant is NOT linked and is NOT the current participant', fakeAsync(() => {
                // Arrange
                const responseInitiatorId = Guid.create().toString();
                const message = new ConsultationRequestResponseMessage(
                    conference.id,
                    invitationId,
                    expectedConsultationRoomLabel,
                    responseInitiatorId,
                    ConsultationAnswer.Accepted,
                    responseInitiatorId
                );

                component['findParticipant'] = jasmine.createSpy('findParticipant').and.returnValue(linkedParticipant);

                spyOn(component, 'onConsultationAccepted');
                spyOn(component, 'onLinkedParticiantRejectedConsultationInvite');
                component.vhParticipant = primaryParticipant;

                // Act
                consultationRequestResponseMessageSubject.next(message);
                flush();

                // Assert
                expect(component.onConsultationAccepted).not.toHaveBeenCalled();
                expect(component.onLinkedParticiantRejectedConsultationInvite).not.toHaveBeenCalled();
            }));

            it('should NOT raise any toasts if the linked participant accepted the consultation invite', fakeAsync(() => {
                // Arrange
                const message = new ConsultationRequestResponseMessage(
                    conference.id,
                    invitationId,
                    expectedConsultationRoomLabel,
                    linkedParticipant.id,
                    ConsultationAnswer.Accepted,
                    linkedParticipant.id
                );

                component['findParticipant'] = jasmine.createSpy('findParticipant').and.returnValue(linkedParticipant);

                spyOn(component, 'onConsultationAccepted');
                spyOn(component, 'onLinkedParticiantRejectedConsultationInvite');
                component.vhParticipant = primaryParticipant;

                // Act
                consultationRequestResponseMessageSubject.next(message);
                flush();

                // Assert
                expect(component.onConsultationAccepted).not.toHaveBeenCalled();
                expect(component.onLinkedParticiantRejectedConsultationInvite).not.toHaveBeenCalled();
            }));

            it('should call onLinkedParticiantAcceptedConsultationInvite if a linked participant accepts the consultation invitation', fakeAsync(() => {
                // Arrange
                const message = new ConsultationRequestResponseMessage(
                    conference.id,
                    invitationId,
                    expectedConsultationRoomLabel,
                    linkedParticipant.id,
                    ConsultationAnswer.Accepted,
                    linkedParticipant.id
                );

                component['findParticipant'] = jasmine.createSpy('findParticipant').and.returnValue(linkedParticipant);
                spyOn(component, 'onLinkedParticiantAcceptedConsultationInvite');
                component.vhParticipant = primaryParticipant;

                // Act
                consultationRequestResponseMessageSubject.next(message);
                flush();

                // Assert
                expect(component.onLinkedParticiantAcceptedConsultationInvite).toHaveBeenCalledOnceWith(
                    expectedConsultationRoomLabel,
                    linkedParticipant.id
                );
            }));

            it('should raise a toast if a linked participant rejected the consultation request', fakeAsync(() => {
                // Arrange
                const message = new ConsultationRequestResponseMessage(
                    conference.id,
                    invitationId,
                    expectedConsultationRoomLabel,
                    linkedParticipant.id,
                    ConsultationAnswer.Rejected,
                    linkedParticipant.id
                );

                component['findParticipant'] = jasmine.createSpy('findParticipant').and.returnValue(linkedParticipant);
                spyOn(component, 'onLinkedParticiantRejectedConsultationInvite');
                component.vhParticipant = primaryParticipant;

                // Act
                consultationRequestResponseMessageSubject.next(message);
                flush();

                // Assert
                expect(component.onLinkedParticiantRejectedConsultationInvite).toHaveBeenCalledOnceWith(
                    linkedParticipant,
                    expectedConsultationRoomLabel
                );
            }));

            it('should NOT raise a toast if a linked participant responed to the consultation request with transferring', fakeAsync(() => {
                // Arrange
                const message = new ConsultationRequestResponseMessage(
                    conference.id,
                    invitationId,
                    expectedConsultationRoomLabel,
                    linkedParticipant.id,
                    ConsultationAnswer.Transferring,
                    linkedParticipant.id
                );

                component['findParticipant'] = jasmine.createSpy('findParticipant').and.returnValue(linkedParticipant);
                spyOn(component, 'onLinkedParticiantRejectedConsultationInvite');
                component.vhParticipant = primaryParticipant;

                // Act
                consultationRequestResponseMessageSubject.next(message);
                flush();

                // Assert
                expect(component.onLinkedParticiantRejectedConsultationInvite).not.toHaveBeenCalled();
            }));

            it('should raise a toast if a linked participant responed to the consultation request with none', fakeAsync(() => {
                // Arrange
                const message = new ConsultationRequestResponseMessage(
                    conference.id,
                    invitationId,
                    expectedConsultationRoomLabel,
                    linkedParticipant.id,
                    ConsultationAnswer.None,
                    linkedParticipant.id
                );

                component['findParticipant'] = jasmine.createSpy('findParticipant').and.returnValue(linkedParticipant);
                spyOn(component, 'onLinkedParticiantRejectedConsultationInvite');
                component.vhParticipant = primaryParticipant;

                // Act
                consultationRequestResponseMessageSubject.next(message);
                flush();

                // Assert
                expect(component.onLinkedParticiantRejectedConsultationInvite).toHaveBeenCalledOnceWith(
                    linkedParticipant,
                    expectedConsultationRoomLabel
                );
            }));

            it('should raise a toast if a linked participants consultation request failed', fakeAsync(() => {
                // Arrange
                const message = new ConsultationRequestResponseMessage(
                    conference.id,
                    invitationId,
                    expectedConsultationRoomLabel,
                    linkedParticipant.id,
                    ConsultationAnswer.Failed,
                    linkedParticipant.id
                );

                component['findParticipant'] = jasmine.createSpy('findParticipant').and.returnValue(linkedParticipant);
                spyOn(component, 'onLinkedParticiantRejectedConsultationInvite');
                component.vhParticipant = primaryParticipant;

                // Act
                consultationRequestResponseMessageSubject.next(message);
                flush();

                // Assert
                expect(component.onLinkedParticiantRejectedConsultationInvite).toHaveBeenCalledOnceWith(
                    linkedParticipant,
                    expectedConsultationRoomLabel
                );
            }));

            it('should call onLinkedParticiantRejectedConsultationInvite when a linked participant rejects the request', fakeAsync(() => {
                // Arrange
                const message = new ConsultationRequestResponseMessage(
                    conference.id,
                    invitationId,
                    expectedConsultationRoomLabel,
                    linkedParticipant.id,
                    ConsultationAnswer.Rejected,
                    linkedParticipant.id
                );

                component['findParticipant'] = jasmine.createSpy('findParticipant').and.returnValue(linkedParticipant);
                component.vhParticipant = primaryParticipant;

                spyOn(component, 'onLinkedParticiantRejectedConsultationInvite');

                // Act
                consultationRequestResponseMessageSubject.next(message);
                flush();

                // Assert
                expect(component.onLinkedParticiantRejectedConsultationInvite).toHaveBeenCalledOnceWith(
                    linkedParticipant,
                    expectedConsultationRoomLabel
                );
            }));

            it('should NOT call onConsulationRejected when it was not sent by client who rejected the request', fakeAsync(() => {
                // Arrange
                const message = new ConsultationRequestResponseMessage(
                    conference.id,
                    invitationId,
                    expectedConsultationRoomLabel,
                    linkedParticipant.id,
                    ConsultationAnswer.Rejected,
                    loggedInParticipant.id
                );

                component['findParticipant'] = jasmine.createSpy('findParticipant').and.returnValue(linkedParticipant);
                component.vhParticipant = primaryParticipant;

                spyOn(component, 'onLinkedParticiantRejectedConsultationInvite');

                // Act
                consultationRequestResponseMessageSubject.next(message);
                flush();

                // Assert
                expect(component.onLinkedParticiantRejectedConsultationInvite).not.toHaveBeenCalled();
            }));

            it('should call onTransferingToConsultation if a transfering message is recieved for the active participant', fakeAsync(() => {
                // Arrange
                spyOn(component, 'onTransferingToConsultation');

                const message = new ConsultationRequestResponseMessage(
                    conference.id,
                    invitationId,
                    expectedConsultationRoomLabel,
                    loggedInParticipant.id,
                    ConsultationAnswer.Transferring,
                    loggedInParticipant.id
                );

                component.vhParticipant = loggedInParticipant;

                // Act
                consultationRequestResponseMessageSubject.next(message);
                flush();

                // Assert
                expect(component.onTransferingToConsultation).toHaveBeenCalledOnceWith(expectedConsultationRoomLabel);
            }));
        });

        describe('onConsultationAccepted', () => {
            beforeEach(() => {
                notificationToastrService.showWaitingForLinkedParticipantsToAccept.calls.reset();
                consultationInvitiationService.getInvitation.calls.reset();
            });

            const expectedConsultationRoomLabel = 'ConsultationRoom7865';
            it('should call createOrUpdateWaitingOnLinkedParticipantsNotification and set the activeParticipantAccepted to true', () => {
                // Arrange
                const invitation = {
                    linkedParticipantStatuses: {},
                    activeToast: null,
                    answer: ConsultationAnswer.None,
                    invitedByName: null
                } as ConsultationInvitation;

                invitation.linkedParticipantStatuses = { lp1: true, lp2: false, lp3: false, lp4: true };
                consultationInvitiationService.getInvitation.withArgs(expectedConsultationRoomLabel).and.returnValue(invitation);

                const expectedToastSpy = jasmine.createSpyObj<VhToastComponent>('VhToastComponent', ['remove']);
                notificationToastrService.showWaitingForLinkedParticipantsToAccept.and.returnValue(expectedToastSpy);

                const findParticipantSpy = (component['findParticipant'] = jasmine.createSpy('findParticipant'));
                findParticipantSpy.and.returnValues({ display_name: 'lp2' }, { display_name: 'lp3' });

                spyOn(component, 'createOrUpdateWaitingOnLinkedParticipantsNotification');
                component.vhParticipant.status = ParticipantStatus.InHearing;
                component.displayDeviceChangeModal = true;

                // Act
                component.onConsultationAccepted(expectedConsultationRoomLabel);

                // Assert
                expect(consultationInvitiationService.getInvitation).toHaveBeenCalledTimes(1);
                expect(consultationInvitiationService.getInvitation).toHaveBeenCalledWith(expectedConsultationRoomLabel);
                expect(invitation.answer).toEqual(ConsultationAnswer.Accepted);
                expect(component.createOrUpdateWaitingOnLinkedParticipantsNotification).toHaveBeenCalledOnceWith(invitation);
                expect(component.displayDeviceChangeModal).toBeFalse();
            });
        });

        describe('onConsultationAccepted', () => {
            beforeEach(() => {
                notificationToastrService.showWaitingForLinkedParticipantsToAccept.calls.reset();
                consultationInvitiationService.getInvitation.calls.reset();
            });

            const expectedConsultationRoomLabel = 'ConsultationRoom567';
            it('should call createOrUpdateWaitingOnLinkedParticipantsNotification and set the activeParticipantAccepted to true', () => {
                // Arrange
                const invitation = {
                    linkedParticipantStatuses: {},
                    activeToast: null,
                    answer: ConsultationAnswer.None,
                    invitedByName: null
                } as ConsultationInvitation;

                invitation.linkedParticipantStatuses = { lp1: true, lp2: false, lp3: false, lp4: true };
                consultationInvitiationService.getInvitation.withArgs(expectedConsultationRoomLabel).and.returnValue(invitation);

                const expectedToastSpy = jasmine.createSpyObj<VhToastComponent>('VhToastComponent', ['remove']);
                notificationToastrService.showWaitingForLinkedParticipantsToAccept.and.returnValue(expectedToastSpy);

                const findParticipantSpy = (component['findParticipant'] = jasmine.createSpy('findParticipant'));
                findParticipantSpy.and.returnValues({ display_name: 'lp2' }, { display_name: 'lp3' });

                spyOn(component, 'createOrUpdateWaitingOnLinkedParticipantsNotification');
                component.vhParticipant.status = ParticipantStatus.InHearing;
                component.displayDeviceChangeModal = true;

                // Act
                component.onConsultationAccepted(expectedConsultationRoomLabel);

                // Assert
                expect(consultationInvitiationService.getInvitation).toHaveBeenCalledTimes(1);
                expect(consultationInvitiationService.getInvitation).toHaveBeenCalledWith(expectedConsultationRoomLabel);
                expect(invitation.answer).toEqual(ConsultationAnswer.Accepted);
                expect(component.createOrUpdateWaitingOnLinkedParticipantsNotification).toHaveBeenCalledOnceWith(invitation);
                expect(component.displayDeviceChangeModal).toBeFalse();
            });
        });

        describe('onConsultationCancelled', () => {
            it('should raise leave consultation request on cancel consultation request', async () => {
                await component.onConsultationCancelled();
                expect(consultationService.leaveConsultation).toHaveBeenCalledWith(conference.id, loggedInParticipant.id);
            });

            it('should log error when cancelling consultation returns an error', async () => {
                const errorSpy = spyOn(mockLogger, 'error');
                const error = { status: 401, isApiException: true };
                consultationService.leaveConsultation.and.rejectWith(error);
                await component.onConsultationCancelled();
                expect(errorSpy).toHaveBeenCalled();
            });
        });
    });

    describe('connectToPexip', () => {
        beforeEach(() => {
            getSpiedPropertyGetter(mockEventsService, 'eventHubIsConnected').and.returnValue(true);
        });

        it('should set up video client and make call when EventsHub is ready', fakeAsync(async () => {
            const onEventsHubReady = new Subject<void>();
            mockEventsService.onEventsHubReady.and.returnValue(onEventsHubReady.asObservable());
            spyOn(component, 'updateShowVideo');

            await component.connectToPexip();
            onEventsHubReady.next();
            flush();

            expect(mockVideoCallService.setupClient).toHaveBeenCalled();
            expect(mockVideoCallService.makeCall).toHaveBeenCalled();
            expect(component.updateShowVideo).toHaveBeenCalled();
        }));

        it('should push the error to error service when setup client fails', fakeAsync(async () => {
            const error = new Error('Failed to setup client');
            mockVideoCallService.setupClient.and.rejectWith(error);

            await component.connectToPexip();
            flush();

            expect(mockErrorService.handleApiError).toHaveBeenCalledWith(error);
        }));
    });

    describe('Video Call Events', () => {
        beforeEach(() => {
            component.setupPexipEventSubscriptionAndClient();
            videoCallService.stopPresentation.calls.reset();
            videoCallService.retrievePresentation.calls.reset();
        });

        afterEach(() => {
            component.executeWaitingRoomCleanup();
        });

        describe('handlePresentationStatusChange', () => {
            const presentationConnectedSubject = onPresentationConnectedMock;
            const presentationDisconnectedSubject = onPresentationDisconnectedMock;
            const onPresentation = onPresentationMock;

            it('should retrieve presentation if started', () => {
                // Arrange
                const payload = new Presentation(true);

                // Act
                onPresentation.next(payload);

                // Assert
                expect(videoCallService.retrievePresentation).toHaveBeenCalled();
            });

            it('should stop presentation if not started', () => {
                // Arrange
                const payload = new Presentation(false);

                // Act
                onPresentation.next(payload);

                // Assert
                expect(videoCallService.stopPresentation).toHaveBeenCalled();
            });

            it('should set stream when connected', () => {
                // Arrange
                component.presentationStream = null;
                const stream = <any>{};
                const payload = new ConnectedPresentation(stream);

                // Act
                presentationConnectedSubject.next(payload);

                // Assert
                expect(component.presentationStream).toBe(stream);
            });

            it('should set stream to null when disconnected', () => {
                // Arrange
                component.presentationStream = <any>{};
                const payload = new DisconnectedPresentation('reason');

                // Act
                presentationDisconnectedSubject.next(payload);

                // Assert
                expect(component.presentationStream).toBe(null);
                expect(videoCallService.stopPresentation).toHaveBeenCalled();
            });
        });

        describe('handleCallSetup', () => {
            const onSetupSubject = onSetupSubjectMock;

            it('should set outgoing stream and connect on call setup', fakeAsync(() => {
                const mockStream = {} as MediaStream;
                const callSetup = new CallSetup(mockStream);

                onSetupSubject.next(callSetup);
                tick();

                expect(component.outgoingStream).toBe(mockStream);
                expect(mockVideoCallService.connect).toHaveBeenCalledWith('', null);
            }));
        });

        describe('handleCallConnected', () => {
            const onConnectedSubject = onConnectedSubjectMock;

            it('should set connected status and call stream on connection', fakeAsync(() => {
                const mockStream = {} as MediaStream;
                const callConnected = new ConnectedCall(mockStream);

                onConnectedSubject.next(callConnected);
                tick();

                expect(component.connected).toBeTrue();
                expect(component.callStream).toBe(mockStream);
                expect(component.errorCount).toBe(0);
            }));
        });

        describe('handleCallError', () => {
            const onErrorSubject = onErrorSubjectMock;
            beforeEach(() => {
                mockErrorService.handlePexipError.calls.reset();
            });

            it('should increment error count and handle pexip error', fakeAsync(() => {
                const error = new CallError('Test error');

                onErrorSubject.next(error);
                tick();

                expect(component.errorCount).toBe(1);
                expect(component.connected).toBeFalse();
                expect(mockErrorService.handlePexipError).toHaveBeenCalledWith(error, component.conferenceId);
            }));

            it('should retry connection on IP address gathering failure if under limit', fakeAsync(() => {
                const error = new CallError('Failed to gather IP addresses');
                component.connectionFailedCount = 0;

                onErrorSubject.next(error);
                tick();

                expect(component.connectionFailedCount).toBe(1);
                expect(mockErrorService.handlePexipError).not.toHaveBeenCalled();
            }));
        });

        describe('handleCallDisconnect', () => {
            const onDisconnectSubject = onDisconnectedSubjectMock;

            it('should set disconnected status and attempt reconnection if hearing not closed', fakeAsync(() => {
                const reason = new DisconnectedCall('Test disconnect');
                spyOn(component.hearing, 'isPastClosedTime').and.returnValue(false);

                onDisconnectSubject.next(reason);
                tick(component.CALL_TIMEOUT);

                expect(component.connected).toBeFalse();
                expect(mockVideoCallService.makeCall).toHaveBeenCalled();
            }));
        });

        describe('handleCallTransfer', () => {
            const onTransferSubject = onCallTransferredMock;

            it('should dettach current stream on transfer', fakeAsync(() => {
                const incomingStream = <any>{};
                component.callStream = incomingStream;
                onTransferSubject.next('new_room');
                tick();
                expect(component.callStream).toBeNull();
            }));
        });
    });

    describe('shouldCurrentUserJoinHearing', () => {
        it('should return true when user is InHearing', () => {
            component.vhParticipant.status = ParticipantStatus.InHearing;

            const result = component.shouldCurrentUserJoinHearing();

            expect(result).toBeTrue();
        });

        it('should return false when user is not InHearing', () => {
            component.vhParticipant.status = ParticipantStatus.Available;

            const result = component.shouldCurrentUserJoinHearing();

            expect(result).toBeFalse();
        });
    });

    describe('isHost', () => {
        afterEach(() => {
            // reset to original
            component.vhParticipant = loggedInParticipant;
        });

        it('should return true when user is a Judge', () => {
            component.vhParticipant = { ...loggedInParticipant, role: Role.Judge };

            const result = component.isHost();

            expect(result).toBeTrue();
        });

        it('should return true when user is a StaffMember', () => {
            component.vhParticipant = { ...loggedInParticipant, role: Role.StaffMember };

            const result = component.isHost();

            expect(result).toBeTrue();
        });

        it('should return false when user is not Judge Or Staff Member', () => {
            component.vhParticipant = { ...loggedInParticipant, role: Role.Individual };

            const result = component.isHost();

            expect(result).toBeFalse();
        });
    });

    describe('isSupportedBrowserForNetworkHealth', () => {
        const testCases = [true, false];

        testCases.forEach(test => {
            it(`should return ${test} when device type service returns ${test}`, () => {
                mockDeviceTypeService.isSupportedBrowserForNetworkHealth.and.returnValue(test);
                const result = component.isSupportedBrowserForNetworkHealth;
                expect(result).toBe(test);
            });
        });
    });

    describe('isParticipantInConference', () => {
        afterEach(() => {
            // reset to original
            component.vhParticipant = loggedInParticipant;
        });

        it('should return true when participant is in hearing', () => {
            component.vhParticipant = { ...loggedInParticipant, status: ParticipantStatus.InHearing };

            const result = component.isParticipantInConference;

            expect(result).toBeTrue();
        });

        it('should return true when participant is in consultation', () => {
            component.vhParticipant = { ...loggedInParticipant, status: ParticipantStatus.InConsultation };
            const result = component.isParticipantInConference;

            expect(result).toBeTrue();
        });

        it('should return false when participant is not in hearing or consultation', () => {
            component.vhParticipant = { ...loggedInParticipant, status: ParticipantStatus.Available };

            const result = component.isParticipantInConference;

            expect(result).toBeFalse();
        });
    });

    describe('getConference', () => {
        it('should dispatch action to get conference', () => {
            spyOn(mockStore, 'dispatch');

            component.getConference();

            expect(mockStore.dispatch).toHaveBeenCalledWith(ConferenceActions.loadConference({ conferenceId: conference.id }));
        });
    });

    describe('joinJudicialConsultation', () => {
        it('should request to join judicial consultation room', async () => {
            await component.joinJudicialConsultation();
            expect(consultationService.joinJudicialConsultationRoom).toHaveBeenCalledWith(conference.id, loggedInParticipant.id);
        });
    });

    describe('leaveJudicialConsultation', () => {
        it('should request to leave judicial consultation room', async () => {
            consultationService.leaveConsultation.calls.reset();
            consultationService.leaveConsultation.and.returnValue(Promise.resolve());
            await component.leaveJudicialConsultation();
            expect(consultationService.leaveConsultation).toHaveBeenCalled();
        });
    });

    describe('willShowHearing', () => {
        it('should show when hearing is in session and participant should join hearing', () => {
            spyOn(component, 'shouldCurrentUserJoinHearing').and.returnValue(true);
            spyOn(component.hearing, 'isInSession').and.returnValue(true);

            const result = component.willShowHearing();

            expect(result).toBeTrue();

            expect(component.displayDeviceChangeModal).toBeFalse();
            expect(component.showConsultationControls).toBeFalse();
            expect(component.isPrivateConsultation).toBeFalse();
            expect(component.showVideo).toBeTrue();
        });

        it('should return false if hearing is not in session', () => {
            spyOn(component.hearing, 'isInSession').and.returnValue(false);

            const result = component.willShowHearing();

            expect(result).toBeFalse();
        });
    });

    describe('willShowConsultation', () => {
        afterEach(() => {
            // reset to original
            component.vhParticipant = loggedInParticipant;
        });

        it('should show consultation when participant is in consultation', () => {
            component.vhParticipant = {
                status: ParticipantStatus.InConsultation
            } as VHParticipant;

            const result = component.willShowConsultation();

            expect(result).toBeTrue();

            expect(component.isPrivateConsultation).toBeTrue();
            expect(component.showConsultationControls).toBeTrue();
            expect(component.displayDeviceChangeModal).toBeFalse();
            expect(component.showVideo).toBeTrue();
        });

        it('should return false if participant is not in consultation', () => {
            component.vhParticipant = {
                status: ParticipantStatus.Available
            } as VHParticipant;

            const result = component.willShowConsultation();

            expect(result).toBeFalse();
        });
    });

    describe('updateShowVideo', () => {
        beforeEach(async () => {
            await fixture.whenStable();
            component.connected = true;
        });
        afterEach(() => {
            // reset to original
            component.vhParticipant = loggedInParticipant;
            component.vhConference = conference;
        });

        it('should not show video when not connected to pexip', () => {
            component.connected = false;

            component.updateShowVideo();

            expect(component.showVideo).toBeFalse();
            expect(component.showConsultationControls).toBeFalse();
            expect(component.isPrivateConsultation).toBeFalse();
        });

        it('should show video when willShowHearing is true', () => {
            spyOn(component.hearing, 'isInSession').and.returnValue(true);
            spyOn(component, 'shouldCurrentUserJoinHearing').and.returnValue(true);

            component.updateShowVideo();

            expect(component.showVideo).toBeTrue();
        });

        it('should show video when participant is a witness and status is in hearing', () => {
            spyOn(component, 'isOrHasWitnessLink').and.returnValue(true);
            component.vhParticipant = {
                hearingRole: HearingRole.WITNESS,
                status: ParticipantStatus.InHearing
            } as VHParticipant;

            component.updateShowVideo();

            expect(component.showVideo).toBeTrue();
        });

        it('should show video when participant is a QL participant and status is in hearing', () => {
            spyOn(component, 'isOrHasWitnessLink').and.returnValue(false);
            component.vhParticipant = {
                hearingRole: HearingRole.QUICK_LINK_PARTICIPANT,
                role: Role.QuickLinkParticipant,
                status: ParticipantStatus.InHearing
            } as VHParticipant;

            component.updateShowVideo();

            expect(component.showVideo).toBeTrue();
        });

        it('should show video when participant is in a consultation', () => {
            component.vhParticipant = {
                ...loggedInParticipant,
                status: ParticipantStatus.InConsultation
            } as VHParticipant;

            component.updateShowVideo();

            expect(component.showVideo).toBeTrue();
            expect(component.showConsultationControls).toBeTrue();
            expect(component.isPrivateConsultation).toBeTrue();
            expect(component.displayDeviceChangeModal).toBeFalse();
        });

        it('should not show video when participant is not in hearing or consultation', () => {
            component.vhParticipant = {
                ...loggedInParticipant,
                status: ParticipantStatus.Available
            } as VHParticipant;

            component.updateShowVideo();

            expect(component.showVideo).toBeFalse();
            expect(component.showConsultationControls).toBeFalse();
            expect(component.isPrivateConsultation).toBeFalse();
        });
    });

    describe('showChooseCameraDialog', () => {
        it('show set display the modal to true', () => {
            component.displayDeviceChangeModal = false;

            component.showChooseCameraDialog();

            expect(component.displayDeviceChangeModal).toBeTrue();
        });

        it('should set displayDeviceChangeModal to false onSelectMediaDeviceShouldClose', () => {
            component.displayDeviceChangeModal = true;
            component.onSelectMediaDeviceShouldClose();
            expect(component.displayDeviceChangeModal).toBeFalsy();
        });
    });

    describe('subscribeToClock', () => {
        beforeEach(() => {
            component.subscribeToClock();
        });

        it('should announce hearing is about to start', fakeAsync(() => {
            component.hearingStartingAnnounced = false;
            mockNotificationSoundsService.playHearingAlertSound.calls.reset();
            spyOn(component.hearing, 'isStarting').and.returnValue(true);

            clockSubject.next(new Date());
            tick();

            expect(component.currentTime).toBeDefined();
            expect(component.hearingStartingAnnounced).toBeTrue();
            expect(mockNotificationSoundsService.playHearingAlertSound).toHaveBeenCalled();
        }));

        it('should navigate user back to the home page when hearing is closed for an extended period', fakeAsync(() => {
            spyOn(component.hearing, 'isPastClosedTime').and.returnValue(true);

            clockSubject.next(new Date());
            tick();

            expect(mockRouter.navigate).toHaveBeenCalledWith([pageUrls.Home]);
        }));

        it('should show room closing mesage when participant is in a private consultation', fakeAsync(() => {
            component.isPrivateConsultation = true;

            const date = new Date();
            clockSubject.next(date);
            tick();

            expect(mockRoomClosingToastrService.showRoomClosingAlert).toHaveBeenCalledWith(component.hearing, date);
        }));

        it('should clear toasts', fakeAsync(() => {
            component.isPrivateConsultation = false;

            clockSubject.next(new Date());
            tick();

            expect(mockRoomClosingToastrService.clearToasts).toHaveBeenCalled();
        }));
    });

    describe('closeAllPCModals', () => {
        it('should close all modals', () => {
            component.closeAllPCModals();
            expect(mockConsultationService.clearModals).toHaveBeenCalled();
        });
    });

    describe('showLeaveConsultationModal', () => {
        it('should show the leave consultation modal', () => {
            fixture.detectChanges(); // Ensure view is initialized
            component.showLeaveConsultationModal();
            expect(mockConsultationService.displayConsultationLeaveModal).toHaveBeenCalled();
        });
    });

    describe('filterEndpoints', () => {
        beforeEach(() => {
            component.vhParticipant = { ...loggedInParticipant, role: Role.Judge };
        });

        afterEach(() => {
            component.vhParticipant = loggedInParticipant;
        });

        it('judge should see all endpoints', () => {
            const result = component.filterEndpoints(conference.endpoints, component.vhParticipant);

            expect(result).toEqual(conference.endpoints);
        });
    });

    describe('checkCaseNameOverflow', () => {
        it('should return false if case name has not been truncated', () => {
            const caseNameElement = document.createElement('div');
            caseNameElement.innerHTML = component.getCaseNameAndNumber();

            const elemRef = new ElementRef(caseNameElement);
            component.roomTitleLabel = elemRef;

            expect(component.hasCaseNameOverflowed).toBeFalsy();
        });

        it('should return true if case name has been truncated', () => {
            const caseNameElement = document.createElement('div');
            const caseName = component.getCaseNameAndNumber();
            caseNameElement.innerHTML = caseName;

            spyOnProperty(caseNameElement, 'scrollWidth').and.returnValue(caseName.length + 1);
            const elemRef = new ElementRef(caseNameElement);
            component.roomTitleLabel = elemRef;

            component.checkCaseNameOverflow();

            expect(component.hasCaseNameOverflowed).toBeTruthy();
        });

        it('should return false if case name element is not set', () => {
            component.roomTitleLabel = null;
            component.checkCaseNameOverflow();
            expect(component.hasCaseNameOverflowed).toBeFalsy();
        });
    });

    describe('isOrHasWitnessLink', () => {
        afterEach(() => {
            // reset to original
            component.vhParticipant = loggedInParticipant;
        });

        it('should return true if participant is a witness', () => {
            component.vhParticipant = { ...loggedInParticipant, hearingRole: HearingRole.WITNESS };
            const result = component.isOrHasWitnessLink();
            expect(result).toBeTrue();
        });

        it('should return true if participant has a witness link', () => {
            const secondParticipant = conference.participants.find(x => x.id !== loggedInParticipant.id);
            secondParticipant.hearingRole = HearingRole.WITNESS;
            component.vhParticipant.linkedParticipants = [
                {
                    linkedId: secondParticipant.id,
                    linkedType: LinkType.Interpreter
                }
            ];

            const result = component.isOrHasWitnessLink();
            expect(result).toBeTrue();
        });
    });

    describe('createOrUpdateWaitingOnLinkedParticipantsNotification', () => {
        beforeEach(() => {
            notificationToastrService.showWaitingForLinkedParticipantsToAccept.calls.reset();
        });

        const expectedConsultationRoomLabel = 'ConsultationRoom';
        const expectedInvitedByName = 'Invited By Name';
        it('should raise a toast if there are linked participants who have NOT accepted their invitation', () => {
            // Arrange
            const invitation = {
                linkedParticipantStatuses: {},
                activeToast: null,
                answer: ConsultationAnswer.None,
                invitedByName: null
            } as ConsultationInvitation;

            invitation.invitedByName = expectedInvitedByName;
            invitation.linkedParticipantStatuses = { lp1: true, lp2: false, lp3: false, lp4: true };
            consultationInvitiationService.getInvitation.and.returnValue(invitation);

            const expectedToastSpy = jasmine.createSpyObj<VhToastComponent>('VhToastComponent', ['remove']);
            notificationToastrService.showWaitingForLinkedParticipantsToAccept.and.returnValue(expectedToastSpy);

            const findParticipantSpy = (component['findParticipant'] = jasmine.createSpy('findParticipant'));
            findParticipantSpy.and.returnValues({ displayName: 'lp2' } as VHParticipant, { displayName: 'lp3' } as VHParticipant);

            const expectedLinkedParticipantsWhoHaventAccepted = ['lp2', 'lp3'];

            component.vhParticipant.status = ParticipantStatus.InHearing;

            // Act
            component.createOrUpdateWaitingOnLinkedParticipantsNotification(invitation);

            // Assert
            expect(findParticipantSpy).toHaveBeenCalledTimes(2);
            expect(findParticipantSpy).toHaveBeenCalledWith(expectedLinkedParticipantsWhoHaventAccepted[0]);
            expect(findParticipantSpy).toHaveBeenCalledWith(expectedLinkedParticipantsWhoHaventAccepted[1]);
            expect(notificationToastrService.showWaitingForLinkedParticipantsToAccept).toHaveBeenCalledOnceWith(
                expectedLinkedParticipantsWhoHaventAccepted,
                expectedInvitedByName,
                true
            );
            expect(invitation.activeToast).toBe(expectedToastSpy);
        });

        it('should close an existing toast before raising a new toast', () => {
            // Arrange
            const invitation = {
                linkedParticipantStatuses: {},
                activeToast: null,
                answer: ConsultationAnswer.None,
                invitedByName: null
            } as ConsultationInvitation;

            invitation.invitedByName = expectedInvitedByName;
            const toastSpy = (invitation.activeToast = jasmine.createSpyObj<VhToastComponent>('VhToastComponent', ['remove']));
            invitation.linkedParticipantStatuses = { lp1: true, lp2: false, lp3: false, lp4: true };
            consultationInvitiationService.getInvitation.and.returnValue(invitation);

            const expectedToastSpy = jasmine.createSpyObj<VhToastComponent>('VhToastComponent', ['remove']);
            notificationToastrService.showWaitingForLinkedParticipantsToAccept.and.returnValue(expectedToastSpy);

            const findParticipantSpy = (component['findParticipant'] = jasmine.createSpy('findParticipant'));
            findParticipantSpy.and.returnValues({ displayName: 'lp2' } as VHParticipant, { displayName: 'lp3' } as VHParticipant);

            const expectedLinkedParticipantsWhoHaventAccepted = ['lp2', 'lp3'];

            component.vhParticipant.status = ParticipantStatus.InHearing;

            // Act
            component.createOrUpdateWaitingOnLinkedParticipantsNotification(invitation);

            // Assert
            expect(findParticipantSpy).toHaveBeenCalledTimes(2);
            expect(findParticipantSpy).toHaveBeenCalledWith(expectedLinkedParticipantsWhoHaventAccepted[0]);
            expect(findParticipantSpy).toHaveBeenCalledWith(expectedLinkedParticipantsWhoHaventAccepted[1]);
            expect(notificationToastrService.showWaitingForLinkedParticipantsToAccept).toHaveBeenCalledOnceWith(
                expectedLinkedParticipantsWhoHaventAccepted,
                expectedInvitedByName,
                true
            );
            expect(invitation.activeToast).toBe(expectedToastSpy);
            expect(toastSpy.remove).toHaveBeenCalledTimes(1);
        });

        it('should NOT raise a toast if there are NO linked participants who have NOT accepted their invitation', () => {
            // Arrange
            const invitation = {
                linkedParticipantStatuses: {},
                activeToast: null,
                answer: ConsultationAnswer.None,
                invitedByName: null
            } as ConsultationInvitation;

            invitation.invitedByName = expectedInvitedByName;
            invitation.linkedParticipantStatuses = { lp1: true, lp2: true, lp3: true, lp4: true };
            consultationInvitiationService.getInvitation.and.returnValue(invitation);

            const expectedToastSpy = jasmine.createSpyObj<VhToastComponent>('VhToastComponent', ['remove']);
            notificationToastrService.showWaitingForLinkedParticipantsToAccept.and.returnValue(expectedToastSpy);

            const findParticipantSpy = (component['findParticipant'] = jasmine.createSpy('findParticipant'));
            findParticipantSpy.and.returnValues({ display_name: 'lp2' }, { display_name: 'lp3' });

            component.vhParticipant.status = ParticipantStatus.InHearing;

            // Act
            component.createOrUpdateWaitingOnLinkedParticipantsNotification(invitation);

            // Assert
            expect(findParticipantSpy).not.toHaveBeenCalled();
            expect(notificationToastrService.showWaitingForLinkedParticipantsToAccept).not.toHaveBeenCalled();
            expect(invitation.activeToast).toBeNull();
        });

        it('should NOT raise a toast if there are NO linked participants', () => {
            // Arrange
            const invitation = {
                linkedParticipantStatuses: {},
                activeToast: null,
                answer: ConsultationAnswer.None,
                invitedByName: null
            } as ConsultationInvitation;

            invitation.invitedByName = expectedInvitedByName;
            consultationInvitiationService.getInvitation.and.returnValue(invitation);

            const expectedToastSpy = jasmine.createSpyObj<VhToastComponent>('VhToastComponent', ['remove']);
            notificationToastrService.showWaitingForLinkedParticipantsToAccept.and.returnValue(expectedToastSpy);

            const findParticipantSpy = (component['findParticipant'] = jasmine.createSpy('findParticipant'));
            findParticipantSpy.and.returnValues({ display_name: 'lp2' }, { display_name: 'lp3' });

            component.vhParticipant.status = ParticipantStatus.InHearing;

            // Act
            component.createOrUpdateWaitingOnLinkedParticipantsNotification(invitation);

            // Assert
            expect(findParticipantSpy).not.toHaveBeenCalled();
            expect(notificationToastrService.showWaitingForLinkedParticipantsToAccept).not.toHaveBeenCalled();
            expect(invitation.activeToast).toBeNull();
        });
    });

    describe('isStaffMember', () => {
        const testCases = [true, false];

        testCases.forEach(test => {
            it(`should return ${test} when helper returns ${test}`, () => {
                spyOn(ParticipantHelper, 'isStaffMember').and.returnValue(test);
                const result = component.isStaffMember;
                expect(result).toBe(test);
            });
        });
    });
});
