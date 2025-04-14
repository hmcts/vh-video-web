import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { of, Subject } from 'rxjs';
import { NonHostWaitingRoomComponent } from './non-host-waiting-room.component';
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
import { NotificationSoundsService } from '../services/notification-sounds.service';
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
    notificationSoundsService,
    notificationToastrService,
    roomClosingToastrService,
    router,
    titleService,
    videoCallService,
    videoWebService
} from '../waiting-room-shared/tests/waiting-room-base-setup';
import { ConferenceStatus, LinkType, LoggedParticipantResponse, ParticipantStatus, Role } from 'src/app/services/clients/api-client';
import { getSpiedPropertyGetter } from 'src/app/shared/jasmine-helpers/property-helpers';
import { mapConferenceToVHConference } from '../store/models/api-contract-to-state-model-mappers';
import { MockComponent } from 'ng-mocks';
import { TranslateService } from '@ngx-translate/core';
import { Title } from 'chart.js';
import { VideoWebService } from 'src/app/services/api/video-web.service';
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
import { NonHostUserRole } from '../waiting-room-shared/models/non-host-user-role';

describe('NonHostWaitingRoomComponent', () => {
    const testData = new ConferenceTestData();
    let conference: VHConference;
    let loggedInParticipant: VHParticipant;

    let component: NonHostWaitingRoomComponent;
    let mockStore: MockStore<ConferenceState>;
    let activatedRoute: ActivatedRoute;

    const mockLogger = new MockLogger();

    let mockVideoCallService: jasmine.SpyObj<VideoCallService>;
    let mockEventsService: jasmine.SpyObj<EventsService>;
    let mockErrorService: jasmine.SpyObj<ErrorService>;
    let mockConsultationService: jasmine.SpyObj<ConsultationService>;
    let mockNotificationSoundsService: jasmine.SpyObj<NotificationSoundsService>;
    let mockNotificationToastrService: jasmine.SpyObj<NotificationToastrService>;
    let mockDeviceTypeService: jasmine.SpyObj<DeviceTypeService>;
    let mockRoomClosingToastrService: jasmine.SpyObj<RoomClosingToastrService>;
    let mockTranslationService = translateServiceSpy;
    let mockRouter: jasmine.SpyObj<Router>;
    let mockClockService: jasmine.SpyObj<ClockService>;
    const clockSubject = new Subject<Date>();
    let mockConsultationInvitiationService = consultationInvitiationService;
    let mockTitleService = titleService;
    let mockLaunchDarklyService: jasmine.SpyObj<LaunchDarklyService>;
    let unloadDetectorServiceSpy: jasmine.SpyObj<UnloadDetectorService>;
    let shouldUnloadSubject: Subject<void>;
    let shouldReloadSubject: Subject<void>;
    let isAudioOnlySubject: Subject<boolean>;
    let mockUserMediaService: jasmine.SpyObj<UserMediaService>;

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
        mockTranslationService = translateServiceSpy;
        mockUserMediaService = jasmine.createSpyObj<UserMediaService>('UserMediaService', [], ['isAudioOnly$']);
        isAudioOnlySubject = new Subject<boolean>();
        getSpiedPropertyGetter(mockUserMediaService, 'isAudioOnly$').and.returnValue(isAudioOnlySubject.asObservable());
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
                NonHostWaitingRoomComponent,
                MockComponent(ModalComponent),
                MockComponent(ConsultationLeaveComponent),
                MockComponent(ConsultationErrorComponent),
                MockComponent(ConsultationLeaveComponent)
            ],
            providers: [
                NonHostWaitingRoomComponent,
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
                { provide: TranslateService, useValue: mockTranslationService },
                { provide: UnloadDetectorService, useValue: unloadDetectorServiceSpy },
                { provide: UserMediaService, useValue: mockUserMediaService },
                provideMockStore()
            ]
        }).compileComponents();

        component = TestBed.inject(NonHostWaitingRoomComponent);
        component.userRole = NonHostUserRole.Participant;

        mockStore = TestBed.inject(MockStore);
        mockStore.overrideSelector(ConferenceSelectors.getActiveConference, conference);
        mockStore.overrideSelector(ConferenceSelectors.getCountdownComplete, conference.countdownComplete);
        mockStore.overrideSelector(ConferenceSelectors.getLoggedInParticipant, loggedInParticipant);
    });

    describe('ngOnInit', () => {
        it('should create as participant', fakeAsync(() => {
            component.userRole = NonHostUserRole.Participant;
            component.ngOnInit();
            tick();
            expect(component).toBeTruthy();
        }));

        it('should create as joh', fakeAsync(() => {
            component.userRole = NonHostUserRole.Joh;
            component.ngOnInit();
            tick();
            expect(component).toBeTruthy();
        }));

        it('should create as other user role', fakeAsync(() => {
            component.userRole = 'OtherRole' as NonHostUserRole;
            component.ngOnInit();
            tick();
            expect(component).toBeTruthy();
        }));
    });

    describe('allowAudioOnlyToggle', () => {
        beforeEach(() => {
            component.userRole = NonHostUserRole.Joh;
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
            component.userRole = NonHostUserRole.Participant;
            expect(component.allowAudioOnlyToggle).toBeTrue();
        });
    });

    describe('isJohRoom', () => {
        it('should return true when the room is a joh room', () => {
            component.vhParticipant = { ...loggedInParticipant, room: { label: 'JudgeJOHConsultationRoom1' } as VHRoom };

            expect(component.isJohRoom).toBeTrue();
        });

        it('should return false when the room is not a joh room', () => {
            component.vhParticipant = { ...loggedInParticipant, room: { label: 'ConsultationRoom1' } as VHRoom };

            expect(component.isJohRoom).toBeFalse();
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

    describe('toggleParticipantsPanel', () => {
        it('should toggle the participants panel', () => {
            component.isParticipantsPanelHidden = false;
            component.toggleParticipantsPanel();
            expect(component.isParticipantsPanelHidden).toBeTrue();
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
                component.userRole = NonHostUserRole.Participant;
            });

            const getConferenceStatusTextTestCases = [
                { conference: testData.getConferenceDetailFuture(), status: ConferenceStatus.NotStarted, expected: '' },
                {
                    conference: testData.getConferenceDetailNow(),
                    status: ConferenceStatus.NotStarted,
                    expected: 'participant-waiting-room.is-about-to-begin'
                },
                {
                    conference: testData.getConferenceDetailPast(),
                    status: ConferenceStatus.NotStarted,
                    expected: 'participant-waiting-room.is-delayed'
                },
                {
                    conference: testData.getConferenceDetailPast(),
                    status: ConferenceStatus.InSession,
                    expected: 'participant-waiting-room.is-in-session'
                },
                {
                    conference: testData.getConferenceDetailPast(),
                    status: ConferenceStatus.Paused,
                    expected: 'participant-waiting-room.is-paused'
                },
                {
                    conference: testData.getConferenceDetailPast(),
                    status: ConferenceStatus.Suspended,
                    expected: 'participant-waiting-room.is-suspended'
                },
                {
                    conference: testData.getConferenceDetailPast(),
                    status: ConferenceStatus.Closed,
                    expected: 'participant-waiting-room.is-closed'
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
                component.userRole = NonHostUserRole.Joh;
            });

            const getConferenceStatusTextTestCases = [
                { conference: testData.getConferenceDetailFuture(), status: ConferenceStatus.NotStarted, expected: '' },
                {
                    conference: testData.getConferenceDetailPast(),
                    status: ConferenceStatus.Suspended,
                    expected: 'joh-waiting-room.is-suspended'
                },
                {
                    conference: testData.getConferenceDetailPast(),
                    status: ConferenceStatus.Paused,
                    expected: 'joh-waiting-room.is-paused'
                },
                {
                    conference: testData.getConferenceDetailPast(),
                    status: ConferenceStatus.Closed,
                    expected: 'joh-waiting-room.is-closed'
                },
                {
                    conference: testData.getConferenceDetailPast(),
                    status: ConferenceStatus.InSession,
                    expected: 'joh-waiting-room.is-in-session'
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

    describe('dismissWarning', () => {
        it('should hide warning', fakeAsync(() => {
            component.showWarning = true;
            component.dismissWarning();
            tick();

            expect(component.showWarning).toBeFalse();
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
            component.ngOnDestroy();

            expect(mockRoomClosingToastrService.clearToasts).toHaveBeenCalled();
            expect(mockStore.dispatch).toHaveBeenCalledWith(
                ConferenceActions.leaveConference({
                    conferenceId: conference.id
                })
            );
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

    describe('isJoh', () => {
        it('should return true when user is a joh', () => {
            component.userRole = NonHostUserRole.Joh;
            expect(component.isJoh).toBeTrue();
        });

        it('should return false when user is a participant', () => {
            component.userRole = NonHostUserRole.Participant;
            expect(component.isJoh).toBeFalse();
        });
    });

    describe('isParticipant', () => {
        it('should return true when user is a participant', () => {
            component.userRole = NonHostUserRole.Participant;
            expect(component.isParticipant).toBeTrue();
        });

        it('should return false when user is a joh', () => {
            component.userRole = NonHostUserRole.Joh;
            expect(component.isParticipant).toBeFalse();
        });
    });
});
