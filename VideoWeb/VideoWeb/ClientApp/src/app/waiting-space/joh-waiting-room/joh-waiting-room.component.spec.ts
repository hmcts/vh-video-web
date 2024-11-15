import { fakeAsync, flushMicrotasks, tick } from '@angular/core/testing';
import {
    ConferenceResponse,
    ConferenceStatus,
    LoggedParticipantResponse,
    ParticipantResponse,
    ParticipantStatus
} from 'src/app/services/clients/api-client';
import { Hearing } from 'src/app/shared/models/hearing';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import {
    clockService,
    consultationInvitiationService,
    consultationService,
    deviceTypeService,
    errorService,
    eventsService,
    focusService,
    globalConference,
    globalParticipant,
    hideComponentsService,
    initAllWRDependencies,
    logger,
    mockConferenceStore,
    mockedHearingVenueFlagsService,
    notificationSoundsService,
    notificationToastrService,
    roomClosingToastrService,
    router,
    titleService,
    videoCallService,
    launchDarklyService,
    videoWebService
} from '../waiting-room-shared/tests/waiting-room-base-setup';
import { JohWaitingRoomComponent } from './joh-waiting-room.component';
import { translateServiceSpy } from 'src/app/testing/mocks/mock-translation.service';
import { UnloadDetectorService } from 'src/app/services/unload-detector.service';
import { of, Subject } from 'rxjs';
import { getSpiedPropertyGetter } from 'src/app/shared/jasmine-helpers/property-helpers';
import { createParticipantRemoteMuteStoreServiceSpy } from '../services/mock-participant-remote-mute-store.service';
import { FEATURE_FLAGS } from 'src/app/services/launch-darkly.service';

describe('JohWaitingRoomComponent', () => {
    let component: JohWaitingRoomComponent;
    const conferenceTestData = new ConferenceTestData();
    let participantRemoteMuteStoreServiceSpy = createParticipantRemoteMuteStoreServiceSpy();

    beforeAll(() => {
        initAllWRDependencies();
    });

    afterAll(() => {
        mockConferenceStore.resetSelectors();
    });

    const logged = new LoggedParticipantResponse({
        participant_id: globalParticipant.id,
        display_name: globalParticipant.display_name,
        role: globalParticipant.role
    });
    const activatedRoute = <any>{
        snapshot: { data: { loggedUser: logged } }
    };

    const translateService = translateServiceSpy;

    const unloadDetectorServiceSpy = jasmine.createSpyObj<UnloadDetectorService>(
        'UnloadDetectorService',
        [],
        ['shouldUnload', 'shouldReload']
    );
    const shouldUnloadSubject = new Subject<void>();
    const shouldReloadSubject = new Subject<void>();
    getSpiedPropertyGetter(unloadDetectorServiceSpy, 'shouldUnload').and.returnValue(shouldUnloadSubject.asObservable());
    getSpiedPropertyGetter(unloadDetectorServiceSpy, 'shouldReload').and.returnValue(shouldReloadSubject.asObservable());

    participantRemoteMuteStoreServiceSpy = createParticipantRemoteMuteStoreServiceSpy();

    beforeEach(async () => {
        launchDarklyService.getFlag.withArgs(FEATURE_FLAGS.vodafone, false).and.returnValue(of(false));
        translateService.instant.calls.reset();
        component = new JohWaitingRoomComponent(
            activatedRoute,
            videoWebService,
            eventsService,
            logger,
            errorService,
            videoCallService,
            deviceTypeService,
            router,
            consultationService,
            notificationSoundsService,
            notificationToastrService,
            roomClosingToastrService,
            clockService,
            translateService,
            consultationInvitiationService,
            unloadDetectorServiceSpy,
            participantRemoteMuteStoreServiceSpy,
            mockedHearingVenueFlagsService,
            titleService,
            hideComponentsService,
            focusService,
            launchDarklyService,
            mockConferenceStore
        );
        const conference = new ConferenceResponse(Object.assign({}, globalConference));
        const participant = new ParticipantResponse(Object.assign({}, globalParticipant));
        component.hearing = new Hearing(conference);
        component.conference = conference;
        component.participant = participant;
        component.connected = true; // assume connected to pexip
        videoWebService.getConferenceById.calls.reset();
        clockService.getClock.calls.reset();
    });

    describe('get allowAudioOnlyToggle', () => {
        it('should return false if the conference is null', () => {
            // Arrange
            component.conference = null;

            // Act
            const result = component.allowAudioOnlyToggle;

            // Arrange
            expect(result).toBeFalse();
        });

        it('should return false if the conference is undefined', () => {
            // Arrange
            component.conference = undefined;

            // Act
            const result = component.allowAudioOnlyToggle;

            // Arrange
            expect(result).toBeFalse();
        });

        it('should return false if the participant is null', () => {
            // Arrange
            component.participant = null;

            // Act
            const result = component.allowAudioOnlyToggle;

            // Arrange
            expect(result).toBeFalse();
        });

        it('should return false if the participant is undefined', () => {
            // Arrange
            component.participant = undefined;

            // Act
            const result = component.allowAudioOnlyToggle;

            // Arrange
            expect(result).toBeFalse();
        });

        it('should return false if the participant is InConsultation', () => {
            // Arrange
            component.participant.status = ParticipantStatus.InConsultation;

            // Act
            const result = component.allowAudioOnlyToggle;

            // Arrange
            expect(result).toBeFalse();
        });

        it('should return false if the participant is InHearing', () => {
            // Arrange
            component.participant.status = ParticipantStatus.InHearing;

            // Act
            const result = component.allowAudioOnlyToggle;

            // Arrange
            expect(result).toBeFalse();
        });

        it('should return true if the participant is Joining', () => {
            // Arrange
            component.participant.status = ParticipantStatus.Joining;

            // Act
            const result = component.allowAudioOnlyToggle;

            // Arrange
            expect(result).toBeTrue();
        });

        it('should return true if the participant is Available', () => {
            // Arrange
            component.participant.status = ParticipantStatus.Available;

            // Act
            const result = component.allowAudioOnlyToggle;

            // Arrange
            expect(result).toBeTrue();
        });

        it('should return true if the participant is Disconnected', () => {
            // Arrange
            component.participant.status = ParticipantStatus.Disconnected;

            // Act
            const result = component.allowAudioOnlyToggle;

            // Arrange
            expect(result).toBeTrue();
        });
    });

    afterEach(() => {
        if (component.eventHubSubscription$) {
            component.ngOnDestroy();
        }
    });

    it('should show audio only toggle', fakeAsync(() => {
        component.conference = globalConference;
        component.participant.status = ParticipantStatus.Available;
        const result = component.allowAudioOnlyToggle;

        expect(result).toBeTrue();
    }));

    describe('ngOnInit', () => {
        beforeEach(() => {
            spyOn(component.eventHubSubscription$, 'add').and.callThrough();
        });

        it('should init hearing alert and subscribers', fakeAsync(() => {
            component.ngOnInit();
            flushMicrotasks();
            tick(100);
            expect(component.clockSubscription$).toBeDefined();
            expect(component.eventHubSubscription$).toBeDefined();
            expect(component.videoCallSubscription$).toBeDefined();
            expect(component.displayDeviceChangeModal).toBeFalsy();
            expect(notificationSoundsService.initHearingAlertSound).toHaveBeenCalled();
            assertSetUpSubscribers();
        }));

        it('should show warning when user is on iPhone', fakeAsync(() => {
            deviceTypeService.isIphone.and.returnValue(true);
            component.ngOnInit();
            tick();

            expect(component.showWarning).toBeTrue();
        }));

        it('should show warning when user is on iPad', fakeAsync(() => {
            deviceTypeService.isIpad.and.returnValue(true);
            component.ngOnInit();
            tick();

            expect(component.showWarning).toBeTrue();
        }));
    });

    describe('dismissWarning', () => {
        beforeEach(() => {
            spyOn(component.eventHubSubscription$, 'add').and.callThrough();
        });

        it('should hide warning and start subscribers', fakeAsync(() => {
            component.showWarning = true;
            component.dismissWarning();
            tick();

            expect(component.showWarning).toBeFalse();
            assertSetUpSubscribers();
        }));
    });

    function assertSetUpSubscribers() {
        expect(clockService.getClock).toHaveBeenCalled();
        expect(component.eventHubSubscription$.add).toHaveBeenCalled();
    }

    const getConferenceStatusTextTestCases = [
        { conference: conferenceTestData.getConferenceDetailFuture(), status: ConferenceStatus.NotStarted, expected: '' },
        {
            conference: conferenceTestData.getConferenceDetailPast(),
            status: ConferenceStatus.InSession,
            expected: 'joh-waiting-room.is-in-session'
        },
        {
            conference: conferenceTestData.getConferenceDetailPast(),
            status: ConferenceStatus.Paused,
            expected: 'joh-waiting-room.is-paused'
        },
        {
            conference: conferenceTestData.getConferenceDetailPast(),
            status: ConferenceStatus.Suspended,
            expected: 'joh-waiting-room.is-suspended'
        },
        {
            conference: conferenceTestData.getConferenceDetailPast(),
            status: ConferenceStatus.Closed,
            expected: 'joh-waiting-room.is-closed'
        }
    ];

    getConferenceStatusTextTestCases.forEach(test => {
        it(`should return hearing status text '${test.expected}'`, () => {
            component.hearing = new Hearing(test.conference);
            component.hearing.getConference().status = test.status;
            expect(component.getConferenceStatusText()).toBe(test.expected);
        });
    });

    const timeClassTestCases = [
        { conference: conferenceTestData.getConferenceDetailFuture(), status: ConferenceStatus.NotStarted, expected: 'hearing-on-time' },
        { conference: conferenceTestData.getConferenceDetailPast(), status: ConferenceStatus.InSession, expected: 'hearing-on-time' },
        { conference: conferenceTestData.getConferenceDetailPast(), status: ConferenceStatus.Paused, expected: 'hearing-on-time' },
        { conference: conferenceTestData.getConferenceDetailPast(), status: ConferenceStatus.Suspended, expected: 'hearing-delayed' },
        { conference: conferenceTestData.getConferenceDetailPast(), status: ConferenceStatus.Closed, expected: 'hearing-on-time' }
    ];

    timeClassTestCases.forEach(test => {
        it('should return "hearing-delayed" class if suspended and "hearing-on-time" class if not suspended', () => {
            component.hearing = new Hearing(test.conference);
            component.hearing.getConference().status = test.status;
            expect(component.getCurrentTimeClass()).toBe(test.expected);
        });
    });
});
