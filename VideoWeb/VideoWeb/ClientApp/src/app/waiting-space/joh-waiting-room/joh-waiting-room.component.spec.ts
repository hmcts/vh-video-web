import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { of, Subject } from 'rxjs';

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
import { VHConference, VHParticipant } from '../store/models/vh-conference';
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
import { ConferenceStatus, LoggedParticipantResponse, ParticipantStatus, Role } from 'src/app/services/clients/api-client';
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
import { VHHearing } from 'src/app/shared/models/hearing.vh';
import { JohWaitingRoomComponent } from './joh-waiting-room.component';

describe('JohWaitingRoomComponent', () => {
    const testData = new ConferenceTestData();
    let conference: VHConference;
    let loggedInParticipant: VHParticipant;

    let component: JohWaitingRoomComponent;
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
                JohWaitingRoomComponent,
                MockComponent(ModalComponent),
                MockComponent(ConsultationLeaveComponent),
                MockComponent(ConsultationErrorComponent),
                MockComponent(ConsultationLeaveComponent)
            ],
            providers: [
                JohWaitingRoomComponent,
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

        component = TestBed.inject(JohWaitingRoomComponent);

        mockStore = TestBed.inject(MockStore);
        mockStore.overrideSelector(ConferenceSelectors.getActiveConference, conference);
        mockStore.overrideSelector(ConferenceSelectors.getCountdownComplete, conference.countdownComplete);
        mockStore.overrideSelector(ConferenceSelectors.getLoggedInParticipant, loggedInParticipant);
    });

    it('should create', fakeAsync(() => {
        component.ngOnInit();
        tick();
        expect(component).toBeTruthy();
    }));

    describe('allowAudioOnlyToggle', () => {
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
    });

    const getConferenceStatusTextTestCases = [
        { conference: testData.getConferenceDetailFuture(), status: ConferenceStatus.NotStarted, expected: '' },
        {
            conference: testData.getConferenceDetailPast(),
            status: ConferenceStatus.InSession,
            expected: 'joh-waiting-room.is-in-session'
        },
        {
            conference: testData.getConferenceDetailPast(),
            status: ConferenceStatus.Paused,
            expected: 'joh-waiting-room.is-paused'
        },
        {
            conference: testData.getConferenceDetailPast(),
            status: ConferenceStatus.Suspended,
            expected: 'joh-waiting-room.is-suspended'
        },
        {
            conference: testData.getConferenceDetailPast(),
            status: ConferenceStatus.Closed,
            expected: 'joh-waiting-room.is-closed'
        }
    ];

    getConferenceStatusTextTestCases.forEach(test => {
        it(`should return hearing status text '${test.expected}'`, () => {
            const vhConference = mapConferenceToVHConference(test.conference);
            component.hearing = new VHHearing(vhConference);
            component.hearing.getConference().status = test.status;
            expect(component.getConferenceStatusText()).toBe(test.expected);
        });
    });

    const timeClassTestCases = [
        { conference: testData.getConferenceDetailFuture(), status: ConferenceStatus.NotStarted, expected: 'hearing-on-time' },
        { conference: testData.getConferenceDetailPast(), status: ConferenceStatus.InSession, expected: 'hearing-on-time' },
        { conference: testData.getConferenceDetailPast(), status: ConferenceStatus.Paused, expected: 'hearing-on-time' },
        { conference: testData.getConferenceDetailPast(), status: ConferenceStatus.Suspended, expected: 'hearing-delayed' },
        { conference: testData.getConferenceDetailPast(), status: ConferenceStatus.Closed, expected: 'hearing-on-time' }
    ];

    timeClassTestCases.forEach(test => {
        it('should return "hearing-delayed" class if suspended and "hearing-on-time" class if not suspended', () => {
            const vhConference = mapConferenceToVHConference(test.conference);
            component.hearing = new VHHearing(vhConference);
            component.hearing.getConference().status = test.status;
            expect(component.getCurrentTimeClass()).toBe(test.expected);
        });
    });
});
