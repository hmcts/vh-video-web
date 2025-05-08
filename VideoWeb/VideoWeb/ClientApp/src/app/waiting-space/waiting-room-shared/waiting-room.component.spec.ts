import { fakeAsync, flush, TestBed, tick } from '@angular/core/testing';
import { of, Subject, Subscription } from 'rxjs';
import { WaitingRoomComponent } from './waiting-room.component';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { createMockStore, MockStore, provideMockStore } from '@ngrx/store/testing';
import { ConsultationService } from 'src/app/services/api/consultation.service';
import { ClockService } from 'src/app/services/clock.service';
import { DeviceTypeService } from 'src/app/services/device-type.service';
import { ErrorService } from 'src/app/services/error.service';
import { EventsService } from 'src/app/services/events.service';
import { FEATURE_FLAGS, LaunchDarklyService } from 'src/app/services/launch-darkly.service';
import { UnloadDetectorService } from 'src/app/services/unload-detector.service';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { MockLogger } from 'src/app/testing/mocks/mock-logger';
import { translateServiceSpy } from 'src/app/testing/mocks/mock-translation.service';
import { NotificationToastrService } from '../services/notification-toastr.service';
import { RoomClosingToastrService } from '../services/room-closing-toast.service';
import { VideoCallService } from '../services/video-call.service';
import { VHConference, VHParticipant, VHRoom } from '../store/models/vh-conference';
import * as ConferenceSelectors from '../store/selectors/conference.selectors';
import { ConferenceState } from '../store/reducers/conference.reducer';
import {
    consultationInvitiationService,
    consultationService,
    deviceTypeService,
    errorService,
    eventsService,
    initAllWRDependencies,
    launchDarklyService,
    notificationToastrService,
    roomClosingToastrService,
    router,
    videoCallEventsService,
    videoCallService
} from '../waiting-room-shared/tests/waiting-room-base-setup';
import { ConferenceStatus, LinkType, LoggedParticipantResponse, ParticipantStatus, Role } from 'src/app/services/clients/api-client';
import { getSpiedPropertyGetter } from 'src/app/shared/jasmine-helpers/property-helpers';
import { mapConferenceToVHConference } from '../store/models/api-contract-to-state-model-mappers';
import { MockComponent } from 'ng-mocks';
import { TranslateService } from '@ngx-translate/core';
import { Logger } from 'src/app/services/logging/logger-base';
import { ModalComponent } from 'src/app/shared/modal/modal.component';
import { ConsultationErrorComponent } from '../consultation-modals/consultation-error/consultation-error.component';
import { ConsultationLeaveComponent } from '../consultation-modals/consultation-leave/consultation-leave.component';
import { ConsultationInvitationService } from '../services/consultation-invitation.service';
import { UserMediaService } from 'src/app/services/user-media.service';
import { HearingRole } from '../models/hearing-role-model';
import { pageUrls } from 'src/app/shared/page-url.constants';
import { VHHearing } from 'src/app/shared/models/hearing.vh';
import { ConferenceActions } from '../store/actions/conference.actions';
import { ParticipantMediaStatus } from 'src/app/shared/models/participant-media-status';
import { WaitingRoomUserRole } from './models/waiting-room-user-role';
import { VideoCallEventsService } from '../services/video-call-events.service';
import { VhToastComponent } from 'src/app/shared/toast/vh-toast.component';
import {
    getWowzaAgentConnectionState$,
    getAudioRecordingPauseState$,
    mockWowzaAgent,
    audioRecordingServiceSpy
} from 'src/app/testing/mocks/mock-audio-recording.service';
import { getAudioRestartActionedMock } from 'src/app/testing/mocks/mock-events-service';
import { VideoCallHostActions } from '../store/actions/video-call-host.actions';
import { AudioRecordingService } from 'src/app/services/audio-recording.service';
import { ModalTrapFocus } from 'src/app/shared/modal/modal-trap-focus';

describe('WaitingRoomComponent', () => {
    const testData = new ConferenceTestData();
    let conference: VHConference;
    let loggedInParticipant: VHParticipant;

    let component: WaitingRoomComponent;
    let mockStore: MockStore<ConferenceState>;
    let activatedRoute: ActivatedRoute;

    const mockLogger = new MockLogger();

    let mockVideoCallService: jasmine.SpyObj<VideoCallService>;
    let mockEventsService: jasmine.SpyObj<EventsService>;
    let mockErrorService: jasmine.SpyObj<ErrorService>;
    let mockConsultationService: jasmine.SpyObj<ConsultationService>;
    let mockNotificationToastrService: jasmine.SpyObj<NotificationToastrService>;
    let mockDeviceTypeService: jasmine.SpyObj<DeviceTypeService>;
    let mockRoomClosingToastrService: jasmine.SpyObj<RoomClosingToastrService>;
    let mockTranslationService = translateServiceSpy;
    let mockRouter: jasmine.SpyObj<Router>;
    let mockClockService: jasmine.SpyObj<ClockService>;
    const clockSubject = new Subject<Date>();
    let mockConsultationInvitiationService = consultationInvitiationService;
    let mockLaunchDarklyService: jasmine.SpyObj<LaunchDarklyService>;
    let unloadDetectorServiceSpy: jasmine.SpyObj<UnloadDetectorService>;
    let shouldUnloadSubject: Subject<void>;
    let shouldReloadSubject: Subject<void>;
    let isAudioOnlySubject: Subject<boolean>;
    let mockUserMediaService: jasmine.SpyObj<UserMediaService>;
    let mockVideoCallEventsService: jasmine.SpyObj<VideoCallEventsService>;
    let mockAudioRecordingService: jasmine.SpyObj<AudioRecordingService>;
    const onVideoWrapperReadySubject = new Subject<void>();
    const onLeaveConsultationSubject = new Subject<void>();
    const onLockConsultationSubject = new Subject<boolean>();
    const onChangeDeviceSubject = new Subject<void>();
    const onChangeLanguageSubject = new Subject<void>();
    const onUpdateUnreadCountSubject = new Subject<number>();

    beforeAll(() => {
        initAllWRDependencies();

        unloadDetectorServiceSpy = jasmine.createSpyObj<UnloadDetectorService>(
            'UnloadDetectorService',
            [],
            ['shouldUnload', 'shouldReload']
        );
        shouldUnloadSubject = new Subject<void>();
        shouldReloadSubject = new Subject<void>();
        getSpiedPropertyGetter(unloadDetectorServiceSpy, 'shouldUnload').and.returnValue(shouldUnloadSubject.asObservable());
        getSpiedPropertyGetter(unloadDetectorServiceSpy, 'shouldReload').and.returnValue(shouldReloadSubject.asObservable());

        conference = mapConferenceToVHConference(testData.getConferenceDetailNow());
        conference.participants = conference.participants.map(x => {
            x.status = ParticipantStatus.Available;
            return x;
        });
        conference.countdownComplete = false;

        // TOOD: clean up above to delcaration only since the values are only set AFTER initAllWRDependencies is called
        mockVideoCallService = videoCallService;
        mockEventsService = eventsService;
        mockErrorService = errorService;
        mockConsultationService = consultationService;
        mockNotificationToastrService = notificationToastrService;
        mockDeviceTypeService = deviceTypeService;
        mockRoomClosingToastrService = roomClosingToastrService;
        mockRouter = router;
        mockClockService = jasmine.createSpyObj<ClockService>('ClockService', ['getClock']);
        mockClockService.getClock.and.returnValue(clockSubject.asObservable());
        mockConsultationInvitiationService = consultationInvitiationService;
        mockLaunchDarklyService = launchDarklyService;
        mockTranslationService = translateServiceSpy;
        mockAudioRecordingService = audioRecordingServiceSpy;
        mockUserMediaService = jasmine.createSpyObj<UserMediaService>('UserMediaService', [], ['isAudioOnly$']);
        isAudioOnlySubject = new Subject<boolean>();
        getSpiedPropertyGetter(mockUserMediaService, 'isAudioOnly$').and.returnValue(isAudioOnlySubject.asObservable());
        mockVideoCallEventsService = videoCallEventsService;
        mockVideoCallEventsService.onVideoWrapperReady.and.returnValue(onVideoWrapperReadySubject.asObservable());
        mockVideoCallEventsService.onLeaveConsultation.and.returnValue(onLeaveConsultationSubject.asObservable());
        mockVideoCallEventsService.onLockConsultationToggled.and.returnValue(onLockConsultationSubject.asObservable());
        mockVideoCallEventsService.onChangeDevice.and.returnValue(onChangeDeviceSubject.asObservable());
        mockVideoCallEventsService.onChangeLanguageSelected.and.returnValue(onChangeLanguageSubject.asObservable());
        mockVideoCallEventsService.onUnreadCountUpdated.and.returnValue(onUpdateUnreadCountSubject.asObservable());
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
            declarations: [
                WaitingRoomComponent,
                MockComponent(ModalComponent),
                MockComponent(ConsultationLeaveComponent),
                MockComponent(ConsultationErrorComponent),
                MockComponent(ConsultationLeaveComponent)
            ],
            providers: [
                WaitingRoomComponent,
                { provide: ActivatedRoute, useValue: activatedRoute },
                { provide: EventsService, useValue: mockEventsService },
                { provide: Logger, useValue: mockLogger },
                { provide: ErrorService, useValue: mockErrorService },
                { provide: VideoCallService, useValue: mockVideoCallService },
                { provide: ConsultationService, useValue: mockConsultationService },
                { provide: NotificationToastrService, useValue: mockNotificationToastrService },
                { provide: DeviceTypeService, useValue: mockDeviceTypeService },
                { provide: Router, useValue: mockRouter },
                { provide: RoomClosingToastrService, useValue: mockRoomClosingToastrService },
                { provide: ClockService, useValue: mockClockService },
                { provide: ConsultationInvitationService, useValue: mockConsultationInvitiationService },
                { provide: LaunchDarklyService, useValue: mockLaunchDarklyService },
                { provide: TranslateService, useValue: mockTranslationService },
                { provide: AudioRecordingService, useValue: mockAudioRecordingService },
                { provide: UnloadDetectorService, useValue: unloadDetectorServiceSpy },
                { provide: UserMediaService, useValue: mockUserMediaService },
                { provide: VideoCallEventsService, useValue: mockVideoCallEventsService },
                provideMockStore()
            ]
        }).compileComponents();

        component = TestBed.inject(WaitingRoomComponent);
        component.userRole = WaitingRoomUserRole.Participant;

        mockStore = TestBed.inject(MockStore);
        mockStore.overrideSelector(ConferenceSelectors.getActiveConference, conference);
        mockStore.overrideSelector(ConferenceSelectors.getCountdownComplete, conference.countdownComplete);
        mockStore.overrideSelector(ConferenceSelectors.getLoggedInParticipant, loggedInParticipant);
        spyOn(ModalTrapFocus, 'trap').and.callFake(() => {});
    });

    describe('ngOnInit', () => {
        const userRoleTestCases = [WaitingRoomUserRole.Participant, WaitingRoomUserRole.Joh, 'OtherRole' as WaitingRoomUserRole];

        userRoleTestCases.forEach(userRole => {
            it(`should init as ${userRole}`, fakeAsync(() => {
                spyOn(mockStore, 'dispatch');
                component.userRole = userRole;
                component.ngOnInit();
                tick();
                expect(component).toBeTruthy();
                expect(mockStore.dispatch).toHaveBeenCalledWith(ConferenceActions.enterWaitingRoom({ userRole: userRole }));
            }));
        });

        const joinHearingWarningTestCases = [true, false];

        joinHearingWarningTestCases.forEach(test => {
            it(`should set showJoinHearingWarning to ${test} when isHandheldIOSDevice returns ${test}`, fakeAsync(() => {
                mockDeviceTypeService.isHandheldIOSDevice.and.returnValue(test);
                component.ngOnInit();
                tick();
                expect(component.showJoinHearingWarning).toBe(test);
            }));
        });

        it('should start subscribers', () => {
            spyOn(component, 'setTrapFocus').and.callThrough();
            spyOn(component, 'showLeaveConsultationModal').and.callThrough();
            spyOn(component, 'setRoomLock').and.callThrough();
            spyOn(component, 'showChooseCameraDialog').and.callThrough();
            spyOn(component, 'showLanguageChangeModal').and.callThrough();
            const roomLocked = true;

            component.ngOnInit();
            onVideoWrapperReadySubject.next();
            onLeaveConsultationSubject.next();
            onLockConsultationSubject.next(roomLocked);
            onChangeDeviceSubject.next();
            onChangeLanguageSubject.next();

            expect(component.setTrapFocus).toHaveBeenCalled();
            expect(component.showLeaveConsultationModal).toHaveBeenCalled();
            expect(component.setRoomLock).toHaveBeenCalledWith(roomLocked);
            expect(component.showChooseCameraDialog).toHaveBeenCalled();
            expect(component.showLanguageChangeModal).toHaveBeenCalled();
        });
    });

    describe('allowAudioOnlyToggle', () => {
        beforeEach(() => {
            component.userRole = WaitingRoomUserRole.Joh;
        });

        it('should return true when particiant is not in a consultation and not in a hearing', () => {
            component.vhParticipant = { ...loggedInParticipant, status: ParticipantStatus.Available };
            expect(component.allowAudioOnlyToggle).toBeTrue();
        });

        it('should return false when particiant is in a consultation', () => {
            component.vhParticipant = { ...loggedInParticipant, status: ParticipantStatus.InConsultation };
            expect(component.allowAudioOnlyToggle).toBeFalse();
        });

        it('should return false when particiant is in a hearing', () => {
            component.vhParticipant = { ...loggedInParticipant, status: ParticipantStatus.InHearing };
            expect(component.allowAudioOnlyToggle).toBeFalse();
        });

        it('should return true when user role is participant', () => {
            component.userRole = WaitingRoomUserRole.Participant;
            expect(component.allowAudioOnlyToggle).toBeTrue();
        });
    });

    describe('check participant role', () => {
        describe('isObserver', () => {
            it('should return true when the participant is an observer', () => {
                component.vhParticipant = { ...loggedInParticipant, hearingRole: HearingRole.OBSERVER };
                expect(component.isObserver).toBeTrue();
            });

            it('should return false when the participant is not an observer', () => {
                component.vhParticipant = { ...loggedInParticipant, hearingRole: HearingRole.APPELLANT };
                expect(component.isObserver).toBeFalse();
            });
        });

        describe('isQuickLinkObserver', () => {
            it('should return true when the participant is a quick link observer', () => {
                component.vhParticipant = { ...loggedInParticipant, role: Role.QuickLinkObserver };
                expect(component.isQuickLinkObserver).toBeTrue();
            });

            it('should return false when the participant is not a quick link observer', () => {
                component.vhParticipant = { ...loggedInParticipant, role: Role.Individual };
                expect(component.isQuickLinkObserver).toBeFalse();
            });
        });

        describe('isQuickLinkParticipant', () => {
            it('should return true when the participant is a quick link observer', () => {
                component.vhParticipant = { ...loggedInParticipant, hearingRole: HearingRole.QUICK_LINK_OBSERVER };
                expect(component.isQuickLinkUser).toBeTrue();
            });

            it('should return true when the participant is a quick link observer', () => {
                component.vhParticipant = { ...loggedInParticipant, hearingRole: HearingRole.QUICK_LINK_PARTICIPANT };
                expect(component.isQuickLinkUser).toBeTrue();
            });

            it('should return false when the participant is not a quick link participant', () => {
                component.vhParticipant = { ...loggedInParticipant, hearingRole: HearingRole.APPELLANT };
                expect(component.isQuickLinkUser).toBeFalse();
            });
        });

        describe('isVictim', () => {
            it('should return true when the participant is a victim', () => {
                component.vhParticipant = { ...loggedInParticipant, hearingRole: HearingRole.VICTIM };
                expect(component.isVictim).toBeTrue();
            });

            it('should return false when the participant is not a victim', () => {
                component.vhParticipant = { ...loggedInParticipant, hearingRole: HearingRole.APPELLANT };
                expect(component.isVictim).toBeFalse();
            });
        });

        describe('isPolice', () => {
            it('should return true when the participant is police', () => {
                component.vhParticipant = { ...loggedInParticipant, hearingRole: HearingRole.POLICE };
                expect(component.isPolice).toBeTrue();
            });

            it('should return false when the participant is not police', () => {
                component.vhParticipant = { ...loggedInParticipant, hearingRole: HearingRole.APPELLANT };
                expect(component.isPolice).toBeFalse();
            });
        });
    });

    describe('subscribeToClock', () => {
        beforeEach(() => {
            component.subscribeToClock();
        });

        it('should navigate user back to the home page when hearing is closed for an extended period', fakeAsync(() => {
            spyOn(component.hearing, 'isPastClosedTime').and.returnValue(true);

            clockSubject.next(new Date());
            tick();

            expect(mockRouter.navigate).toHaveBeenCalledWith([pageUrls.ParticipantHearingList]);
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

    describe('canStartJoinConsultation', () => {
        afterEach(() => {
            component.vhParticipant = loggedInParticipant;
        });

        it('should return true if the participant is a representative', () => {
            component.vhParticipant = {
                ...loggedInParticipant,
                hearingRole: HearingRole.REPRESENTATIVE,
                linkedParticipants: []
            };
            expect(component.canStartJoinConsultation).toBeTrue();
        });

        it('should return false if the participant is a witness', () => {
            component.vhParticipant = {
                ...loggedInParticipant,
                hearingRole: HearingRole.WITNESS,
                linkedParticipants: []
            };
            expect(component.canStartJoinConsultation).toBeFalse();
        });

        it('should return false if the participant is an observer', () => {
            component.vhParticipant = {
                ...loggedInParticipant,
                hearingRole: HearingRole.OBSERVER,
                linkedParticipants: []
            };
            expect(component.canStartJoinConsultation).toBeFalse();
        });

        it('should return false if the participant is a individual with interpreter', () => {
            component.vhParticipant = {
                ...loggedInParticipant,
                hearingRole: HearingRole.LITIGANT_IN_PERSON,
                linkedParticipants: [{ linkedType: LinkType.Interpreter }]
            };
            expect(component.canStartJoinConsultation).toBeFalse();
        });

        it('should return false if the participant is a QL observer', () => {
            component.vhParticipant = {
                ...loggedInParticipant,
                role: Role.QuickLinkObserver,
                linkedParticipants: []
            };
            expect(component.canStartJoinConsultation).toBeFalse();
        });

        it('should return true if the participant is a QL participant', () => {
            component.vhParticipant = {
                ...loggedInParticipant,
                role: Role.QuickLinkParticipant,
                linkedParticipants: []
            };
            expect(component.canStartJoinConsultation).toBeTrue();
        });

        it('should return false if the participant is a victim', () => {
            component.vhParticipant = {
                ...loggedInParticipant,
                hearingRole: HearingRole.VICTIM,
                linkedParticipants: []
            };
            expect(component.canStartJoinConsultation).toBeFalsy();
        });

        it('should return false if the participant is police', () => {
            component.vhParticipant = {
                ...loggedInParticipant,
                hearingRole: HearingRole.POLICE,
                linkedParticipants: []
            };
            expect(component.canStartJoinConsultation).toBeFalsy();
        });
    });

    describe('getConferenceStatusText', () => {
        describe('user is a participant', () => {
            beforeEach(() => {
                component.userRole = WaitingRoomUserRole.Participant;
            });

            const getConferenceStatusTextTestCases = [
                { conference: testData.getConferenceDetailFuture(), status: ConferenceStatus.NotStarted, expected: '' },
                {
                    conference: testData.getConferenceDetailNow(),
                    status: ConferenceStatus.NotStarted,
                    expected: 'waiting-room.is-about-to-begin'
                },
                {
                    conference: testData.getConferenceDetailPast(),
                    status: ConferenceStatus.NotStarted,
                    expected: 'waiting-room.is-delayed'
                },
                {
                    conference: testData.getConferenceDetailPast(),
                    status: ConferenceStatus.InSession,
                    expected: 'waiting-room.is-in-session'
                },
                {
                    conference: testData.getConferenceDetailPast(),
                    status: ConferenceStatus.Paused,
                    expected: 'waiting-room.is-paused'
                },
                {
                    conference: testData.getConferenceDetailPast(),
                    status: ConferenceStatus.Suspended,
                    expected: 'waiting-room.is-suspended'
                },
                {
                    conference: testData.getConferenceDetailPast(),
                    status: ConferenceStatus.Closed,
                    expected: 'waiting-room.is-closed'
                }
            ];

            getConferenceStatusTextTestCases.forEach(test => {
                it(`should return hearing status '${test.status}' text '${test.expected}'`, () => {
                    const conf = mapConferenceToVHConference(test.conference);
                    component.hearing = new VHHearing(conf);
                    component.hearing.getConference().status = test.status;
                    mockTranslationService.instant.calls.reset();
                    expect(component.getConferenceStatusText()).toBe(test.expected);
                });
            });
        });

        describe('user is not a participant', () => {
            beforeEach(() => {
                component.userRole = WaitingRoomUserRole.Joh;
            });

            const getConferenceStatusTextTestCases = [
                { conference: testData.getConferenceDetailFuture(), status: ConferenceStatus.NotStarted, expected: '' },
                {
                    conference: testData.getConferenceDetailPast(),
                    status: ConferenceStatus.Suspended,
                    expected: 'waiting-room.is-suspended'
                },
                {
                    conference: testData.getConferenceDetailPast(),
                    status: ConferenceStatus.Paused,
                    expected: 'waiting-room.is-paused'
                },
                {
                    conference: testData.getConferenceDetailPast(),
                    status: ConferenceStatus.Closed,
                    expected: 'waiting-room.is-closed'
                },
                {
                    conference: testData.getConferenceDetailPast(),
                    status: ConferenceStatus.InSession,
                    expected: 'waiting-room.is-in-session'
                }
            ];

            getConferenceStatusTextTestCases.forEach(test => {
                it(`should return hearing status '${test.status}' text '${test.expected}'`, () => {
                    const conf = mapConferenceToVHConference(test.conference);
                    component.hearing = new VHHearing(conf);
                    component.hearing.getConference().status = test.status;
                    mockTranslationService.instant.calls.reset();
                    expect(component.getConferenceStatusText()).toBe(test.expected);
                });
            });
        });
    });

    describe('getRoomName', () => {
        it('should return the room name', () => {
            component.vhParticipant = { ...loggedInParticipant, room: { label: 'Room1' } as VHRoom };

            component.getRoomName();

            expect(mockConsultationService.consultationNameToString).toHaveBeenCalledWith('Room1', false);
        });
    });

    describe('modals', () => {
        it('should display the start consultation modal', () => {
            component.displayStartPrivateConsultationModal = false;

            component.openStartConsultationModal();

            expect(component.displayStartPrivateConsultationModal).toBeTrue();
        });

        it('should close the start consultation modal', () => {
            component.displayStartPrivateConsultationModal = true;

            component.closeStartPrivateConsultationModal();

            expect(component.displayStartPrivateConsultationModal).toBeFalse();
        });

        it('should display join consultation modal', () => {
            component.displayJoinPrivateConsultationModal = false;

            component.openJoinConsultationModal();

            expect(component.displayJoinPrivateConsultationModal).toBeTrue();
        });

        it('should close the join consultation modal', () => {
            component.displayJoinPrivateConsultationModal = true;

            component.closeJoinPrivateConsultationModal();

            expect(component.displayJoinPrivateConsultationModal).toBeFalse();
        });

        it('should show language change modal', () => {
            component.displayLanguageModal = false;

            component.showLanguageChangeModal();

            expect(component.displayLanguageModal).toBeTrue();
        });

        it('should close language change modal', () => {
            component.displayLanguageModal = true;

            component.closeLanguageChangeModal();

            expect(component.displayLanguageModal).toBeFalse();
        });
    });

    describe('setRoomLock', () => {
        beforeEach(() => {
            mockConsultationService.lockConsultation.calls.reset();
        });
        afterEach(() => {
            component.vhParticipant = loggedInParticipant;
        });
        it('should set the room lock', () => {
            component.vhParticipant = {
                ...loggedInParticipant,
                room: { label: 'Room1', locked: false } as VHRoom
            };

            component.setRoomLock(true);

            expect(mockConsultationService.lockConsultation).toHaveBeenCalledWith(conference.id, 'Room1', true);
        });

        it('should do nothing if participant is not in a room', () => {
            component.vhParticipant = { ...loggedInParticipant, room: null };

            component.setRoomLock(true);

            expect(mockConsultationService.lockConsultation).not.toHaveBeenCalled();
        });
    });

    describe('startPrivateConsultation', () => {
        beforeEach(() => {
            mockConsultationService.createParticipantConsultationRoom.calls.reset();
        });

        it('should start a private consultation', async () => {
            const particiant = conference.participants.find(x => x.role === Role.Representative);
            const endpoint = conference.endpoints[0];

            await component.startPrivateConsultation([particiant.id], [endpoint.id]);

            expect(mockConsultationService.createParticipantConsultationRoom).toHaveBeenCalledWith(
                conference.id,
                loggedInParticipant.id,
                [particiant.id],
                [endpoint.id]
            );
            expect(component.privateConsultationAccordianExpanded).toBeFalse();
        });
    });

    describe('joinPrivateConsultation', () => {
        beforeEach(() => {
            mockConsultationService.joinPrivateConsultationRoom.calls.reset();
        });

        it('should join a private consultation', async () => {
            await component.joinPrivateConsultation('Room1');

            expect(mockConsultationService.joinPrivateConsultationRoom).toHaveBeenCalledWith(
                conference.id,
                loggedInParticipant.id,
                'Room1'
            );
            expect(component.privateConsultationAccordianExpanded).toBeFalse();
            expect(component.hasTriedToLeaveConsultation).toBeFalse();
            expect(component.displayJoinPrivateConsultationModal).toBeFalse();
        });
    });

    describe('toggleAccordian', () => {
        it('should toggle the accordian', () => {
            component.privateConsultationAccordianExpanded = false;

            component.toggleAccordian();

            expect(component.privateConsultationAccordianExpanded).toBeTrue();
        });
    });

    describe('dismissJoinHearingWarning', () => {
        it('should hide joing hearing warning', fakeAsync(() => {
            component.showJoinHearingWarning = true;
            component.dismissJoinHearingWarning();
            tick();

            expect(component.showJoinHearingWarning).toBeFalse();
        }));
    });

    describe('onLeaveHearingButtonClicked', () => {
        it('should display leave hearing popup', () => {
            component.displayLeaveHearingPopup = false;
            component.onLeaveHearingButtonClicked();
            expect(component.displayLeaveHearingPopup).toBeTrue();
        });
    });

    describe('cleanUp', () => {
        it('should clean up on destroy', () => {
            spyOn(mockStore, 'dispatch');
            const mockSubscription1 = jasmine.createSpyObj<Subscription>('Subscription', ['unsubscribe']);
            const mockSubscription2 = jasmine.createSpyObj<Subscription>('Subscription', ['unsubscribe']);
            component.subscriptions = [mockSubscription1, mockSubscription2];

            component.ngOnDestroy();

            expect(mockRoomClosingToastrService.clearToasts).toHaveBeenCalled();
            expect(mockStore.dispatch).toHaveBeenCalledWith(
                ConferenceActions.leaveConference({
                    conferenceId: conference.id
                })
            );
            expect(mockSubscription1.unsubscribe).toHaveBeenCalled();
            expect(mockSubscription2.unsubscribe).toHaveBeenCalled();
        });
    });

    describe('userMediaService.isAutioOnly$ changed', () => {
        it('should publish the media status when audio toggle changes', fakeAsync(() => {
            component.ngOnInit();
            tick();
            isAudioOnlySubject.next(true);
            tick();
            expect(component.audioOnly).toBeTrue();

            expect(mockEventsService.sendMediaStatus).toHaveBeenCalledWith(
                conference.id,
                loggedInParticipant.id,
                new ParticipantMediaStatus(false, true)
            );
        }));
    });

    describe('isJudge', () => {
        it('should return true when user is a judge', () => {
            component.userRole = WaitingRoomUserRole.Judge;
            expect(component.isJudge).toBeTrue();
        });

        it('should return false when user is a participant', () => {
            component.userRole = WaitingRoomUserRole.Participant;
            expect(component.isJudge).toBeFalse();
        });
    });

    describe('isJoh', () => {
        it('should return true when user is a joh', () => {
            component.userRole = WaitingRoomUserRole.Joh;
            expect(component.isJoh).toBeTrue();
        });

        it('should return false when user is a participant', () => {
            component.userRole = WaitingRoomUserRole.Participant;
            expect(component.isJoh).toBeFalse();
        });
    });

    describe('isParticipant', () => {
        it('should return true when user is a participant', () => {
            component.userRole = WaitingRoomUserRole.Participant;
            expect(component.isParticipant).toBeTrue();
        });

        it('should return false when user is a joh', () => {
            component.userRole = WaitingRoomUserRole.Joh;
            expect(component.isParticipant).toBeFalse();
        });
    });

    describe('judge tests', () => {
        beforeEach(() => {
            component.userRole = WaitingRoomUserRole.Judge;
        });

        describe('ngOnInit', () => {
            it('should initialise the component when conference and participant are set', () => {
                spyOn(component, 'initForJudge').and.callThrough();

                component.ngOnInit();

                expect(component.initForJudge).toHaveBeenCalled();
            });

            it('should start subscribers', () => {
                spyOn(component, 'setTrapFocus').and.callThrough();
                spyOn(component, 'showLeaveConsultationModal').and.callThrough();
                spyOn(component, 'showChooseCameraDialog').and.callThrough();
                spyOn(component, 'unreadMessageCounterUpdate').and.callThrough();
                const unreadCount = 5;

                component.ngOnInit();
                onVideoWrapperReadySubject.next();
                onLeaveConsultationSubject.next();
                onChangeDeviceSubject.next();
                onUpdateUnreadCountSubject.next(unreadCount);

                expect(component.setTrapFocus).toHaveBeenCalled();
                expect(component.showLeaveConsultationModal).toHaveBeenCalled();
                expect(component.showChooseCameraDialog).toHaveBeenCalled();
                expect(component.unreadMessageCounterUpdate).toHaveBeenCalledWith(unreadCount);
            });
        });

        describe('ngOnDestroy', () => {
            it('should unsubscribe', () => {
                const mockSubscription1 = jasmine.createSpyObj<Subscription>('Subscription', ['unsubscribe']);
                const mockSubscription2 = jasmine.createSpyObj<Subscription>('Subscription', ['unsubscribe']);
                component.subscriptions = [mockSubscription1, mockSubscription2];

                component.ngOnDestroy();

                expect(mockSubscription1.unsubscribe).toHaveBeenCalled();
                expect(mockSubscription2.unsubscribe).toHaveBeenCalled();
            });
        });

        describe('canShowHearingLayoutSelection', () => {
            it('should return false when conference is closed', () => {
                spyOn(component.hearing, 'isClosed').and.returnValue(true);

                expect(component.canShowHearingLayoutSelection).toBeFalse();
            });

            it('should return false when conference is in session', () => {
                spyOn(component.hearing, 'isInSession').and.returnValue(true);

                expect(component.canShowHearingLayoutSelection).toBeFalse();
            });

            it('should return true when confrence is not close and not in session', () => {
                spyOn(component.hearing, 'isClosed').and.returnValue(false);
                spyOn(component.hearing, 'isInSession').and.returnValue(false);

                expect(component.canShowHearingLayoutSelection).toBeTrue();
            });
        });

        describe('getConferenceStatusText', () => {
            const getConferenceStatusTextTestCases = [
                { status: ConferenceStatus.NotStarted, expected: 'waiting-room.start-this-hearing' },
                { status: ConferenceStatus.InSession, expected: 'waiting-room.hearing-is-in-session' },
                { status: ConferenceStatus.Paused, expected: 'waiting-room.hearing-paused' },
                { status: ConferenceStatus.Suspended, expected: 'waiting-room.hearing-suspended' },
                { status: ConferenceStatus.Closed, expected: 'waiting-room.hearing-is-closed' }
            ];

            getConferenceStatusTextTestCases.forEach(test => {
                it(`should return hearing status '${test.status}' text '${test.expected}'`, () => {
                    component.vhConference.status = test.status;
                    mockTranslationService.instant.calls.reset();
                    expect(component.getConferenceStatusText()).toBe(test.expected);
                });
            });
        });

        describe('Hearing Statuses', () => {
            describe('isNotStarted', () => {
                it('should return true when conference is not started', () => {
                    spyOn(component.hearing, 'isNotStarted').and.returnValue(true);
                    expect(component.isNotStarted()).toBeTrue();
                });

                it('should return false when conference is has started', () => {
                    spyOn(component.hearing, 'isNotStarted').and.returnValue(false);
                    expect(component.isNotStarted()).toBeFalse();
                });
            });

            describe('isPaused', () => {
                it('should return true when conference is paused', () => {
                    spyOn(component.hearing, 'isPaused').and.returnValue(true);
                    spyOn(component.hearing, 'isSuspended').and.returnValue(false);
                    expect(component.isPaused()).toBeTrue();
                });

                it('should retrun true when conference is suspended', () => {
                    spyOn(component.hearing, 'isPaused').and.returnValue(true);
                    spyOn(component.hearing, 'isSuspended').and.returnValue(true);
                    expect(component.isPaused()).toBeTrue();
                });

                it('should return false when conference is not paused', () => {
                    spyOn(component.hearing, 'isPaused').and.returnValue(false);
                    expect(component.isPaused()).toBeFalse();
                });
            });

            describe('hearingSuspended', () => {
                it('should return true when conference status is suspended', () => {
                    component.vhConference = { ...conference, status: ConferenceStatus.Suspended };

                    expect(component.hearingSuspended()).toBeTrue();
                });

                it('should return false when conference is not suspended', () => {
                    component.vhConference = { ...conference, status: ConferenceStatus.InSession };

                    expect(component.hearingSuspended()).toBeFalse();
                });
            });

            describe('hearingPaused', () => {
                it('should return true when conference status is paused', () => {
                    component.vhConference = { ...conference, status: ConferenceStatus.Paused };

                    expect(component.hearingPaused()).toBeTrue();
                });

                it('should return false when conference is not paused', () => {
                    component.vhConference = { ...conference, status: ConferenceStatus.InSession };

                    expect(component.hearingPaused()).toBeFalse();
                });
            });

            describe('isHearingInSession', () => {
                it('should return true when conference is in session', () => {
                    component.vhConference = { ...conference, status: ConferenceStatus.InSession };

                    expect(component.isHearingInSession()).toBeTrue();
                });

                it('should return false when conference is not in session', () => {
                    component.vhConference = { ...conference, status: ConferenceStatus.NotStarted };

                    expect(component.isHearingInSession()).toBeFalse();
                });
            });

            describe('displayConfirmStartPopup', () => {
                it('should display popup on start clicked', () => {
                    component.displayConfirmStartHearingPopup = false;
                    component.displayConfirmStartPopup();
                    expect(component.displayConfirmStartHearingPopup).toBeTruthy();
                });
            });

            describe('displayConfirmStartupPopup', () => {
                it('should NOT start hearing when confirmation answered no', fakeAsync(() => {
                    // Arrange
                    component.displayConfirmStartHearingPopup = true;
                    spyOn(mockStore, 'dispatch').and.callThrough();

                    // Act
                    component.onStartConfirmAnswered(false);
                    flush();

                    // Assert
                    expect(component.displayConfirmStartHearingPopup).toBeFalsy();
                    expect(mockStore.dispatch).not.toHaveBeenCalledWith(
                        VideoCallHostActions.startHearing({
                            conferenceId: conference.id
                        })
                    );
                }));

                it('should start hearing when confirmation answered yes', fakeAsync(() => {
                    // Arrange
                    component.displayConfirmStartHearingPopup = true;
                    spyOn(mockStore, 'dispatch').and.callThrough();

                    // Act
                    component.onStartConfirmAnswered(false);
                    flush();

                    // Act
                    component.onStartConfirmAnswered(true);
                    flush();

                    // Assert
                    expect(component.displayConfirmStartHearingPopup).toBeFalsy();
                    expect(mockStore.dispatch).toHaveBeenCalledWith(
                        VideoCallHostActions.startHearing({
                            conferenceId: conference.id
                        })
                    );
                }));
            });

            describe('onJoinConfirmAnswered', () => {
                it('should join hearing when answer is true', () => {
                    spyOn(mockStore, 'dispatch').and.callThrough();

                    component.onJoinConfirmAnswered(true);

                    expect(component.displayJoinHearingPopup).toBeFalsy();
                    expect(mockStore.dispatch).toHaveBeenCalledWith(
                        VideoCallHostActions.joinHearing({
                            conferenceId: conference.id,
                            participantId: loggedInParticipant.id
                        })
                    );
                });

                it('should not join hearing when answer is false', () => {
                    spyOn(mockStore, 'dispatch').and.callThrough();
                    component.onJoinConfirmAnswered(false);

                    expect(component.displayJoinHearingPopup).toBeFalsy();
                    expect(mockStore.dispatch).not.toHaveBeenCalledWith(
                        VideoCallHostActions.joinHearing({
                            conferenceId: conference.id,
                            participantId: loggedInParticipant.id
                        })
                    );
                });
            });

            describe('joinHearingClicked', () => {
                it('should display join hearing popup', () => {
                    component.displayJoinHearingPopup = false;
                    component.joinHearingClicked();
                    expect(component.displayJoinHearingPopup).toBeTruthy();
                });
            });
        });

        describe('defineIsIMEnabled', () => {
            afterEach(() => {
                component.vhParticipant = loggedInParticipant;
            });

            it('should not enable IM when hearing has not been initalised', () => {
                component.hearing = null;
                expect(component.defineIsIMEnabled()).toBeFalsy();
            });

            it('should not enable IM when participant is in a consultation', () => {
                component.vhParticipant = { ...loggedInParticipant, status: ParticipantStatus.InConsultation };
                expect(component.defineIsIMEnabled()).toBeFalsy();
            });

            it('should enable IM for non ipad devices', () => {
                deviceTypeService.isIpad.and.returnValue(false);
                expect(component.defineIsIMEnabled()).toBeTruthy();
            });

            it('should enable IM for ipad devices and video is not on screen', () => {
                deviceTypeService.isIpad.and.returnValue(true);
                component.showVideo = false;
                expect(component.defineIsIMEnabled()).toBeTruthy();
            });

            it('should not enable IM for ipad devices and video is on screen', () => {
                deviceTypeService.isIpad.and.returnValue(true);
                component.showVideo = true;
                expect(component.defineIsIMEnabled()).toBeFalsy();
            });
        });

        describe('unreadMessageCounterUpdate', () => {
            it('should update unread message counter', () => {
                component.unreadMessageCount = 0;
                component.unreadMessageCounterUpdate(1);
                expect(component.unreadMessageCount).toBe(1);
            });
        });

        describe('Audio recording and alert notifications', () => {
            beforeEach(() => {
                component.vhConference = conference;

                notificationToastrService.showAudioRecordingErrorWithRestart.calls.reset();
                notificationToastrService.showAudioRecordingRestartSuccess.calls.reset();
                notificationToastrService.showAudioRecordingRestartFailure.calls.reset();
            });

            describe('getAudioRestartActioned event', () => {
                const audioActionRestartedSubject = getAudioRestartActionedMock;
                beforeEach(() => {
                    component.init();
                });

                afterEach(() => {
                    component.executeWaitingRoomCleanup();
                });

                it('should close any open audio alert when audio restart actioned', fakeAsync(() => {
                    component.audioErrorRetryToast = jasmine.createSpyObj<VhToastComponent>('VhToastComponent', ['remove'], {
                        vhToastOptions: { buttons: [], color: 'white', concludeToast: jasmine.createSpy('concludeToast') }
                    });
                    audioActionRestartedSubject.next(conference.id);
                    tick();

                    expect(component.audioErrorRetryToast.vhToastOptions.concludeToast).toHaveBeenCalled();
                }));
            });

            describe('getWowzaAgentConnectionState event', () => {
                const getWowzaAgentConnectionStateSubject = getWowzaAgentConnectionState$;
                beforeEach(() => {
                    component.init();
                });

                afterEach(() => {
                    component.executeWaitingRoomCleanup();
                });

                describe('onWowzaDisconnected', () => {
                    it('should display audio alert if wowza listener is disconnected', fakeAsync(() => {
                        component.vhConference = {
                            ...conference,
                            status: ConferenceStatus.InSession,
                            audioRecordingRequired: true,
                            countdownComplete: true
                        };

                        getWowzaAgentConnectionStateSubject.next(false);
                        tick();

                        expect(notificationToastrService.showAudioRecordingErrorWithRestart).toHaveBeenCalled();
                    }));

                    it('should not display audio alert if wowza listener is disconnected, but conference is not in session', fakeAsync(() => {
                        component.audioErrorRetryToast = null;
                        component.vhConference = {
                            ...conference,
                            status: ConferenceStatus.Paused,
                            audioRecordingRequired: true,
                            countdownComplete: false
                        };

                        getWowzaAgentConnectionStateSubject.next(false);
                        tick();

                        expect(notificationToastrService.showAudioRecordingErrorWithRestart).not.toHaveBeenCalled();
                    }));
                });

                describe('onWowzaConnected', () => {
                    it('should show audio restart success alert when restart was actioned', fakeAsync(() => {
                        getSpiedPropertyGetter(mockAudioRecordingService, 'restartActioned').and.returnValue(true);

                        getWowzaAgentConnectionStateSubject.next(true);
                        tick();

                        expect(notificationToastrService.showAudioRecordingRestartSuccess).toHaveBeenCalled();
                        expect(component.continueWithNoRecording).toBeFalse();
                    }));
                });

                it('should close alert if hearing is disconnected and no longer showing the video', () => {
                    component.audioErrorRetryToast = jasmine.createSpyObj<VhToastComponent>('VhToastComponent', ['remove']);
                    component.videoClosedExt();
                    expect(component.audioErrorRetryToast).toBeNull();
                });
            });

            describe('getAudioRecordingPauseState event', () => {
                const getAudioRecordingPauseStateSubject = getAudioRecordingPauseState$;
                beforeEach(() => {
                    component.init();
                });

                afterEach(() => {
                    component.executeWaitingRoomCleanup();
                });

                it('update audio recording status', fakeAsync(() => {
                    getAudioRecordingPauseStateSubject.next(true);
                    tick();

                    expect(component.recordingPaused).toBeTrue();
                }));
            });
        });

        describe('getCountdownComplete from Store', () => {
            beforeEach(() => {
                component.init();
                mockNotificationToastrService.showAudioRecordingErrorWithRestart.calls.reset();
            });
            it('should verify audio recording stream when countdown is complete', fakeAsync(() => {
                conference.audioRecordingRequired = true;
                conference.countdownComplete = true;

                spyOn(component, 'verifyAudioRecordingStream');

                mockStore.overrideSelector(ConferenceSelectors.getActiveConference, conference);
                mockStore.overrideSelector(ConferenceSelectors.getCountdownComplete, conference.countdownComplete);

                mockStore.refreshState();
                tick();

                expect(component.verifyAudioRecordingStream).toHaveBeenCalled();
            }));
        });

        describe('verifyAudioRecordingStream', () => {
            beforeEach(() => {
                mockNotificationToastrService.showAudioRecordingErrorWithRestart.calls.reset();
            });
            it('should log wowza alert and show audio recording restart alert when audio recording is required', () => {
                component.vhConference = { ...conference, audioRecordingRequired: true };
                component.continueWithNoRecording = false;
                component.showVideo = true;
                component.audioErrorRetryToast = null;
                component.recordingPaused = false;

                const toast = jasmine.createSpyObj<VhToastComponent>('VhToastComponent', ['remove'], {
                    vhToastOptions: { buttons: [], color: 'white', concludeToast: jasmine.createSpy('concludeToast') }
                });
                mockNotificationToastrService.showAudioRecordingErrorWithRestart.and.returnValue(toast);
                getSpiedPropertyGetter(mockAudioRecordingService, 'wowzaAgent').and.returnValue({
                    ...mockWowzaAgent,
                    isAudioOnlyCall: false
                });

                component.verifyAudioRecordingStream();
                component.verifyAudioRecordingStream();

                expect(notificationToastrService.showAudioRecordingErrorWithRestart).toHaveBeenCalledTimes(1);
            });
        });

        describe('audioRestartCallback', () => {
            it('should set continue with no recording to true', () => {
                component.audioErrorRetryToast = jasmine.createSpyObj<VhToastComponent>('VhToastComponent', ['remove'], {
                    vhToastOptions: { buttons: [], color: 'white', concludeToast: jasmine.createSpy('concludeToast') }
                });

                component.audioRestartCallback(true);
                expect(component.continueWithNoRecording).toBeTrue();
                expect(component.audioErrorRetryToast).toBeNull();
            });
        });
    });
});
