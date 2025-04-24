import { fakeAsync, flush, TestBed, tick } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { createMockStore, MockStore, provideMockStore } from '@ngrx/store/testing';
import { of, Subject } from 'rxjs';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { MockLogger } from 'src/app/testing/mocks/mock-logger';
import { VHConference, VHParticipant } from '../store/models/vh-conference';
import * as ConferenceSelectors from '../store/selectors/conference.selectors';
import { ConferenceState } from '../store/reducers/conference.reducer';
import {
    videoCallService,
    eventsService,
    errorService,
    consultationService,
    notificationSoundsService,
    notificationToastrService,
    deviceTypeService,
    roomClosingToastrService,
    router,
    consultationInvitiationService,
    titleService,
    launchDarklyService,
    initAllWRDependencies,
    videoWebService
} from '../waiting-room-shared/tests/waiting-room-base-setup';
import { JudgeWaitingRoomComponent } from './judge-waiting-room.component';
import { mapConferenceToVHConference } from '../store/models/api-contract-to-state-model-mappers';
import { ConferenceStatus, LoggedParticipantResponse, ParticipantStatus, Role } from 'src/app/services/clients/api-client';
import { ClockService } from 'src/app/services/clock.service';
import { Title } from 'chart.js';
import { ConsultationService } from 'src/app/services/api/consultation.service';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { DeviceTypeService } from 'src/app/services/device-type.service';
import { ErrorService } from 'src/app/services/error.service';
import { EventsService } from 'src/app/services/events.service';
import { FEATURE_FLAGS, LaunchDarklyService } from 'src/app/services/launch-darkly.service';
import { Logger } from 'src/app/services/logging/logger-base';
import { ConsultationInvitationService } from '../services/consultation-invitation.service';
import { NotificationSoundsService } from '../services/notification-sounds.service';
import { NotificationToastrService } from '../services/notification-toastr.service';
import { RoomClosingToastrService } from '../services/room-closing-toast.service';
import { VideoCallService } from '../services/video-call.service';
import { translateServiceSpy } from 'src/app/testing/mocks/mock-translation.service';
import { TranslateService } from '@ngx-translate/core';
import {
    audioRecordingServiceSpy,
    getAudioRecordingPauseState$,
    getWowzaAgentConnectionState$,
    mockWowzaAgent
} from '../../testing/mocks/mock-audio-recording.service';
import { AudioRecordingService } from 'src/app/services/audio-recording.service';
import { UnloadDetectorService } from 'src/app/services/unload-detector.service';
import { getSpiedPropertyGetter } from 'src/app/shared/jasmine-helpers/property-helpers';
import { MockComponent } from 'ng-mocks';
import { ModalComponent } from 'src/app/shared/modal/modal.component';
import { ConsultationLeaveComponent } from '../consultation-modals/consultation-leave/consultation-leave.component';
import { ConsultationErrorComponent } from '../consultation-modals/consultation-error/consultation-error.component';
import { VideoCallHostActions } from '../store/actions/video-call-host.actions';
import { pageUrls } from 'src/app/shared/page-url.constants';
import { VhToastComponent } from 'src/app/shared/toast/vh-toast.component';
import { getAudioRestartActionedMock } from 'src/app/testing/mocks/mock-events-service';

describe('JudgeWaitingRoom', () => {
    const testData = new ConferenceTestData();
    let conference: VHConference;
    let loggedInParticipant: VHParticipant;

    let component: JudgeWaitingRoomComponent;
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
    let mockAudioRecordingService: jasmine.SpyObj<AudioRecordingService>;
    let unloadDetectorServiceSpy: jasmine.SpyObj<UnloadDetectorService>;
    let shouldUnloadSubject: Subject<void>;
    let shouldReloadSubject: Subject<void>;

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
        mockAudioRecordingService = audioRecordingServiceSpy;
    });

    beforeEach(async () => {
        mockLaunchDarklyService.getFlag.withArgs(FEATURE_FLAGS.instantMessaging, jasmine.any(Boolean)).and.returnValue(of(true));

        loggedInParticipant = conference.participants.find(x => x.role === Role.Judge);

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
                JudgeWaitingRoomComponent,
                MockComponent(ModalComponent),
                MockComponent(ConsultationLeaveComponent),
                MockComponent(ConsultationErrorComponent),
                MockComponent(ConsultationLeaveComponent)
            ],
            providers: [
                JudgeWaitingRoomComponent,
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
                { provide: AudioRecordingService, useValue: mockAudioRecordingService },
                { provide: UnloadDetectorService, useValue: unloadDetectorServiceSpy },
                provideMockStore()
            ]
        }).compileComponents();

        component = TestBed.inject(JudgeWaitingRoomComponent);

        mockStore = TestBed.inject(MockStore);
        mockStore.overrideSelector(ConferenceSelectors.getActiveConference, conference);
        mockStore.overrideSelector(ConferenceSelectors.getCountdownComplete, conference.countdownComplete);
        mockStore.overrideSelector(ConferenceSelectors.getLoggedInParticipant, loggedInParticipant);
    });

    afterEach(() => {
        component.executeWaitingRoomCleanup();
    });

    afterAll(() => {
        mockStore.resetSelectors();
    });

    describe('ngOnInit', () => {
        it('should initialise the component when conference and participant are set', () => {
            spyOn(component, 'init').and.callThrough();

            component.ngOnInit();

            expect(component.init).toHaveBeenCalled();
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

    describe('isStaffMember', () => {
        it('should be true if the use is a staff member', () => {
            component.loggedInUser = new LoggedParticipantResponse({ role: Role.StaffMember });

            expect(component.isStaffMember()).toBeTrue();
        });

        it('should be false if the use is not a staff member', () => {
            component.loggedInUser = new LoggedParticipantResponse({ role: Role.Judge });

            expect(component.isStaffMember()).toBeFalse();
        });
    });

    describe('getConferenceStatusText', () => {
        const getConferenceStatusTextTestCases = [
            { status: ConferenceStatus.NotStarted, expected: 'judge-waiting-room.start-this-hearing' },
            { status: ConferenceStatus.InSession, expected: 'judge-waiting-room.hearing-is-in-session' },
            { status: ConferenceStatus.Paused, expected: 'judge-waiting-room.hearing-paused' },
            { status: ConferenceStatus.Suspended, expected: 'judge-waiting-room.hearing-suspended' },
            { status: ConferenceStatus.Closed, expected: 'judge-waiting-room.hearing-is-closed' }
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

        describe('goToJudgeHearingList', () => {
            it('should navigate to judge hearing list', () => {
                component.goToJudgeHearingList();
                expect(mockRouter.navigate).toHaveBeenCalledWith([pageUrls.JudgeHearingList]);
            });
        });

        describe('checkEquipement', () => {
            it('should navigate to check equipment with conference id', () => {
                component.checkEquipment();
                expect(mockRouter.navigate).toHaveBeenCalledWith([pageUrls.EquipmentCheck, conference.id]);
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

    describe('leaveConsultation', () => {
        beforeEach(() => {
            mockConsultationService.displayConsultationLeaveModal.calls.reset();
        });
        it('should display leave consultation popup when in a consultation', async () => {
            const button = document.createElement('button');
            button.id = 'consultation-leave-button';
            spyOn(document, 'getElementById').and.returnValue(button);
            component.isPrivateConsultation = true;

            await component.leaveConsultation();

            expect(mockConsultationService.displayConsultationLeaveModal).toHaveBeenCalled();
        });

        it('should not display leave consultation popup when not in a consultation', async () => {
            component.isPrivateConsultation = false;
            await component.leaveConsultation();

            expect(mockConsultationService.displayConsultationLeaveModal).not.toHaveBeenCalled();
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
            getSpiedPropertyGetter(mockAudioRecordingService, 'wowzaAgent').and.returnValue({ ...mockWowzaAgent, isAudioOnlyCall: false });

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
