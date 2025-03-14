import { ComponentFixture, fakeAsync, flush, TestBed, tick } from '@angular/core/testing';
import { of, Subject } from 'rxjs';
import { LoggedParticipantResponse, ParticipantStatus, Role } from 'src/app/services/clients/api-client';
import { CallSetup, ConnectedCall, CallError, DisconnectedCall } from '../../models/video-call-models';
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
import { mapConferenceToVHConference } from '../../store/models/api-contract-to-state-model-mappers';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { VHConference, VHParticipant } from '../../store/models/vh-conference';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import {
    clockService,
    consultationInvitiationService,
    consultationService,
    deviceTypeService,
    errorService,
    eventsService,
    initAllWRDependencies,
    launchDarklyService,
    notificationSoundsService,
    notificationToastrService,
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
import { ConsultationInvitationService } from '../../services/consultation-invitation.service';
import { Title } from '@angular/platform-browser';
import { FEATURE_FLAGS, LaunchDarklyService } from 'src/app/services/launch-darkly.service';
import { TransferDirection } from 'src/app/services/models/hearing-transfer';

fdescribe('WaitingRoomBaseDirective', () => {
    const testData = new ConferenceTestData();
    let conference: VHConference;
    let loggedInParticipant: VHParticipant;

    let component: WaitingRoomBaseDirective;
    let mockStore: MockStore<ConferenceState>;
    let activatedRoute: ActivatedRoute;

    let mockLogger = new MockLogger();

    let mockVideoCallService = videoCallService;
    let mockEventsService = eventsService;
    let mockErrorService = errorService;
    let mockConsultationService = consultationService;
    let mockNotificationSoundsService = notificationSoundsService;
    let mockNotificationToastrService = notificationToastrService;
    let mockDeviceTypeService = deviceTypeService;
    let mockRoomClosingToastrService = roomClosingToastrService;
    let mockRouter = router;
    let mockClockService = clockService;
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
        mockClockService = clockService;
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

        TestBed.createComponent(WRTestComponent);
        component = TestBed.inject(WRTestComponent);

        mockStore = TestBed.inject(MockStore);
        mockStore.overrideSelector(ConferenceSelectors.getActiveConference, conference);
        mockStore.overrideSelector(ConferenceSelectors.getLoggedInParticipant, loggedInParticipant);
    });

    afterEach(() => {
        component.executeWaitingRoomCleanup();
        // mockStore.resetSelectors();
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
    });

    // describe('connectToPexip', () => {
    //     it('should set up video client and make call when EventsHub is ready', fakeAsync(() => {
    //         const onEventsHubReady = new Subject<void>();
    //         mockEventsService.onEventsHubReady.and.returnValue(onEventsHubReady.asObservable());

    //         component.connectToPexip();
    //         flush();

    //         expect(mockVideoCallService.setupClient).toHaveBeenCalled();
    //         expect(mockVideoCallService.makeCall).toHaveBeenCalled();
    //     }));
    // });

    // describe('handleCallSetup', () => {
    //     it('should set outgoing stream and connect on call setup', () => {
    //         const mockStream = {} as MediaStream;
    //         const callSetup = new CallSetup(mockStream);

    //         component.handleCallSetup(callSetup);

    //         expect(component.outgoingStream).toBe(mockStream);
    //         expect(mockVideoCallService.connect).toHaveBeenCalledWith('', null);
    //     });
    // });

    // describe('handleCallConnected', () => {
    //     it('should set connected status and call stream on connection', () => {
    //         const mockStream = {} as MediaStream;
    //         const callConnected = new ConnectedCall(mockStream);

    //         component.handleCallConnected(callConnected);

    //         expect(component.connected).toBeTrue();
    //         expect(component.callStream).toBe(mockStream);
    //         expect(component.errorCount).toBe(0);
    //     });
    // });

    // describe('handleCallError', () => {
    //     it('should increment error count and handle pexip error', () => {
    //         const error = new CallError('Test error');

    //         component.handleCallError(error);

    //         expect(component.errorCount).toBe(1);
    //         expect(component.connected).toBeFalse();
    //         expect(mockErrorService.handlePexipError).toHaveBeenCalledWith(error, component.conferenceId);
    //     });

    //     it('should retry connection on IP address gathering failure if under limit', () => {
    //         const error = new CallError('Failed to gather IP addresses');
    //         component.connectionFailedCount = 0;

    //         component.handleCallError(error);

    //         expect(component.connectionFailedCount).toBe(1);
    //         expect(mockErrorService.handlePexipError).not.toHaveBeenCalled();
    //     });
    // });

    // describe('handleCallDisconnect', () => {
    //     it('should set disconnected status and attempt reconnection if hearing not closed', fakeAsync(() => {
    //         const reason = new DisconnectedCall('Test disconnect');
    //         spyOn(component.hearing, 'isPastClosedTime').and.returnValue(false);

    //         component.handleCallDisconnect(reason);
    //         tick(component.CALL_TIMEOUT);

    //         expect(component.connected).toBeFalse();
    //         expect(mockVideoCallService.makeCall).toHaveBeenCalled();
    //     }));
    // });

    // describe('disconnect', () => {
    //     it('should clean up video call state', () => {
    //         component.connected = true;
    //         component.callStream = {} as MediaStream;
    //         component.outgoingStream = {} as MediaStream;

    //         component.disconnect();

    //         expect(component.connected).toBeFalse();
    //         expect(component.callStream).toBeNull();
    //         expect(component.outgoingStream).toBeNull();
    //         expect(mockVideoCallService.disconnectFromCall).toHaveBeenCalled();
    //     });
    // });

    // describe('willShowConsultation', () => {
    //     it('should show consultation when participant is in consultation', () => {
    //         component.vhParticipant = {
    //             status: ParticipantStatus.InConsultation
    //         } as any;

    //         const result = component.willShowConsultation();

    //         expect(result).toBeTrue();
    //         expect(component.isPrivateConsultation).toBeTrue();
    //         expect(component.showConsultationControls).toBeTrue();
    //     });
    // });

    // describe('updateShowVideo', () => {
    //     it('should hide video when not connected', () => {
    //         component.connected = false;

    //         component.updateShowVideo();

    //         expect(component.showVideo).toBeFalse();
    //     });

    //     it('should show video for witness in hearing', () => {
    //         component.connected = true;
    //         component.vhParticipant = {
    //             hearingRole: 'WITNESS',
    //             status: ParticipantStatus.InHearing
    //         } as any;

    //         component.updateShowVideo();

    //         expect(component.showVideo).toBeTrue();
    //     });
    // });

    // describe('onConsultationCancelled', () => {
    //     it('should attempt to leave consultation', async () => {
    //         await component.onConsultationCancelled();

    //         expect(component.hasTriedToLeaveConsultation).toBeTrue();
    //         expect(mockConsultationService.leaveConsultation).toHaveBeenCalled();
    //     });
    // });
});
