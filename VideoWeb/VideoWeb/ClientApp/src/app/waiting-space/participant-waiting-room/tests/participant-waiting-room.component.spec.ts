import { fakeAsync, flush, flushMicrotasks, tick } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { ActiveToast } from 'ngx-toastr';
import { Subject, Subscription } from 'rxjs';
import {
    ConferenceResponse,
    ConferenceStatus,
    LinkedParticipantResponse,
    LinkType,
    LoggedParticipantResponse,
    ParticipantResponse,
    ParticipantStatus,
    Role
} from 'src/app/services/clients/api-client';
import { Hearing } from 'src/app/shared/models/hearing';
import { pageUrls } from 'src/app/shared/page-url.constants';
import { RoomClosingToastComponent } from 'src/app/shared/toast/room-closing/room-closing-toast.component';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { HearingRole } from '../../models/hearing-role-model';
import { VideoCallPreferences } from '../../services/video-call-preferences.mode';
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
    heartbeatModelMapper,
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
    videoWebService
} from '../../waiting-room-shared/tests/waiting-room-base-setup';
import { ParticipantWaitingRoomComponent } from '../participant-waiting-room.component';
import { translateServiceSpy } from 'src/app/testing/mocks/mock-translation.service';
import { UnloadDetectorService } from 'src/app/services/unload-detector.service';
import { getSpiedPropertyGetter } from 'src/app/shared/jasmine-helpers/property-helpers';
import { createParticipantRemoteMuteStoreServiceSpy } from '../../services/mock-participant-remote-mute-store.service';
import { UserMediaService } from 'src/app/services/user-media.service';
import { CaseTypeGroup } from '../../models/case-type-group';

describe('ParticipantWaitingRoomComponent when conference exists', () => {
    let component: ParticipantWaitingRoomComponent;
    const conferenceTestData = new ConferenceTestData();
    let logged: LoggedParticipantResponse;
    let activatedRoute: ActivatedRoute;
    const translateService = translateServiceSpy;
    let unloadDetectorServiceSpy: jasmine.SpyObj<UnloadDetectorService>;
    let userMediaServiceSpy: jasmine.SpyObj<UserMediaService>;
    let isAudioOnlySubject: Subject<boolean>;
    let shouldUnloadSubject: Subject<void>;
    let shouldReloadSubject: Subject<void>;

    beforeAll(() => {
        initAllWRDependencies();

        const mockToast = {
            toastRef: {
                componentInstance: {}
            }
        } as ActiveToast<RoomClosingToastComponent>;
        roomClosingToastrService.showRoomClosingAlert.and.callFake((h, d) => {
            roomClosingToastrService.currentToast = mockToast;
        });
        roomClosingToastrService.clearToasts.and.callFake(() => {
            roomClosingToastrService.currentToast = null;
        });

        const preferences = new VideoCallPreferences();
        preferences.audioOnly = false;
    });

    afterAll(() => {
        mockConferenceStore.resetSelectors();
    });

    let participantRemoteMuteStoreServiceSpy = createParticipantRemoteMuteStoreServiceSpy();

    beforeEach(() => {
        unloadDetectorServiceSpy = jasmine.createSpyObj<UnloadDetectorService>(
            'UnloadDetectorService',
            [],
            ['shouldUnload', 'shouldReload']
        );
        userMediaServiceSpy = jasmine.createSpyObj<UserMediaService>('UserMediaService', [], ['isAudioOnly$']);
        isAudioOnlySubject = new Subject<boolean>();
        getSpiedPropertyGetter(userMediaServiceSpy, 'isAudioOnly$').and.returnValue(isAudioOnlySubject.asObservable());

        shouldUnloadSubject = new Subject<void>();
        shouldReloadSubject = new Subject<void>();
        getSpiedPropertyGetter(unloadDetectorServiceSpy, 'shouldUnload').and.returnValue(shouldUnloadSubject.asObservable());
        getSpiedPropertyGetter(unloadDetectorServiceSpy, 'shouldReload').and.returnValue(shouldReloadSubject.asObservable());

        consultationService.consultationNameToString.calls.reset();
        logged = new LoggedParticipantResponse({
            participant_id: globalParticipant.id,
            display_name: globalParticipant.display_name,
            role: globalParticipant.role
        });
        activatedRoute = <any>{
            snapshot: { data: { loggedUser: logged }, paramMap: convertToParamMap({ conferenceId: globalConference.id }) }
        };

        participantRemoteMuteStoreServiceSpy = createParticipantRemoteMuteStoreServiceSpy();

        component = new ParticipantWaitingRoomComponent(
            activatedRoute,
            videoWebService,
            eventsService,
            logger,
            errorService,
            heartbeatModelMapper,
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
            userMediaServiceSpy,
            titleService,
            hideComponentsService,
            focusService,
            mockConferenceStore
        );

        const conference = new ConferenceResponse(Object.assign({}, globalConference));
        const participant = new ParticipantResponse(Object.assign({}, globalParticipant));
        component.hearing = new Hearing(conference);
        component.conference = conference;
        component.participant = participant;
        component.connected = true; // assume connected to pexip
        videoWebService.getConferenceById.calls.reset();
    });

    afterEach(() => {
        component.ngOnDestroy();
    });

    describe('toggleParticipantsPanel', () => {
        it('should switch isParticipantsPanelHidden from false to true to false to true to false when starting from false', () => {
            // Arrange
            component.isParticipantsPanelHidden = false;

            // Act & Assert
            component.toggleParticipantsPanel();
            expect(component.isParticipantsPanelHidden).toBe(true);

            component.toggleParticipantsPanel();
            expect(component.isParticipantsPanelHidden).toBe(false);

            component.toggleParticipantsPanel();
            expect(component.isParticipantsPanelHidden).toBe(true);

            component.toggleParticipantsPanel();
            expect(component.isParticipantsPanelHidden).toBe(false);
        });
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

    describe('ngOnInit', () => {
        it('should subscribe to audio only property and send message when it occurs', fakeAsync(() => {
            component.audioOnly = false;
            component.ngOnInit();
            tick();

            isAudioOnlySubject.next(true);
            tick();

            expect(eventsService.sendMediaStatus.calls.mostRecent().args[0]).toBe(component.conferenceId);
            expect(eventsService.sendMediaStatus.calls.mostRecent().args[1]).toBe(component.participant.id);
            expect(eventsService.sendMediaStatus.calls.mostRecent().args[2].is_local_audio_muted).toBeFalse();
            expect(eventsService.sendMediaStatus.calls.mostRecent().args[2].is_local_video_muted).toBeTrue();
        }));
    });

    it('should start with "What is a private meeting?" accordian collapsed', fakeAsync(() => {
        expect(component.privateConsultationAccordianExpanded).toBeFalsy();
    }));

    it('should expand "What is a private meeting?" accordian', fakeAsync(() => {
        component.toggleAccordian();
        expect(component.privateConsultationAccordianExpanded).toBeTruthy();
    }));

    it('should collapse "What is a private meeting?" accordian', fakeAsync(() => {
        component.privateConsultationAccordianExpanded = true;
        component.toggleAccordian();
        expect(component.privateConsultationAccordianExpanded).toBeFalsy();
    }));

    it('should not announce hearing is starting when already announced', () => {
        spyOn(component, 'announceHearingIsAboutToStart').and.callFake(() => Promise.resolve());
        component.hearingStartingAnnounced = true;
        component.checkIfHearingIsStarting();
        expect(component.announceHearingIsAboutToStart).toHaveBeenCalledTimes(0);
    });

    it('should not announce hearing ready to start when hearing is not near start time', () => {
        spyOn(component, 'announceHearingIsAboutToStart').and.callFake(() => Promise.resolve());
        component.hearing = new Hearing(new ConferenceTestData().getConferenceDetailFuture());
        component.hearingStartingAnnounced = false;
        component.checkIfHearingIsStarting();
        expect(component.announceHearingIsAboutToStart).toHaveBeenCalledTimes(0);
    });

    it('should announce hearing ready to start and not already announced', () => {
        spyOn(component, 'announceHearingIsAboutToStart').and.callFake(() => Promise.resolve());
        component.hearing = new Hearing(new ConferenceTestData().getConferenceDetailNow());
        component.hearingStartingAnnounced = false;
        component.checkIfHearingIsStarting();
        expect(component.announceHearingIsAboutToStart).toHaveBeenCalledTimes(1);
    });

    it('should clear subscription and go to hearing list when conference is past closed time', () => {
        const conf = new ConferenceTestData().getConferenceDetailNow();
        const status = ConferenceStatus.Closed;
        const closedDateTime = new Date(new Date().toUTCString());
        closedDateTime.setUTCMinutes(closedDateTime.getUTCMinutes() - 120);
        conf.status = status;
        conf.closed_date_time = closedDateTime;
        component.hearing = new Hearing(conf);
        component.clockSubscription$ = jasmine.createSpyObj<Subscription>('Subscription', ['unsubscribe']);

        component.checkIfHearingIsClosed();

        expect(component.clockSubscription$.unsubscribe).toHaveBeenCalled();
        expect(router.navigate).toHaveBeenCalledWith([pageUrls.ParticipantHearingList]);
    });

    const getConferenceStatusTextTestCases = [
        { conference: conferenceTestData.getConferenceDetailFuture(), status: ConferenceStatus.NotStarted, expected: '' },
        {
            conference: conferenceTestData.getConferenceDetailNow(),
            status: ConferenceStatus.NotStarted,
            expected: 'participant-waiting-room.is-about-to-begin'
        },
        {
            conference: conferenceTestData.getConferenceDetailPast(),
            status: ConferenceStatus.NotStarted,
            expected: 'participant-waiting-room.is-delayed'
        },
        {
            conference: conferenceTestData.getConferenceDetailPast(),
            status: ConferenceStatus.InSession,
            expected: 'participant-waiting-room.is-in-session'
        },
        {
            conference: conferenceTestData.getConferenceDetailPast(),
            status: ConferenceStatus.Paused,
            expected: 'participant-waiting-room.is-paused'
        },
        {
            conference: conferenceTestData.getConferenceDetailPast(),
            status: ConferenceStatus.Suspended,
            expected: 'participant-waiting-room.is-suspended'
        },
        {
            conference: conferenceTestData.getConferenceDetailPast(),
            status: ConferenceStatus.Closed,
            expected: 'participant-waiting-room.is-closed'
        }
    ];

    getConferenceStatusTextTestCases.forEach(test => {
        it(`should return hearing status text '${test.expected}'`, () => {
            component.hearing = new Hearing(test.conference);
            component.hearing.getConference().status = test.status;
            translateService.instant.calls.reset();
            expect(component.getConferenceStatusText()).toBe(test.expected);
        });
    });

    it('should return if the participant is a witness or not - canStartJoinConsultation', () => {
        [
            [HearingRole.REPRESENTATIVE, true],
            [HearingRole.WITNESS, false],
            [HearingRole.OBSERVER, false]
        ].forEach(([hearingRole, expected]) => {
            component.participant.hearing_role = hearingRole as HearingRole;
            component.participant.linked_participants = [];
            expect(component.canStartJoinConsultation).toBe(expected as boolean);
        });
    });

    it('should return false if the participant is a individual with interpreter - canStartJoinConsultation', () => {
        component.participant.hearing_role = HearingRole.LITIGANT_IN_PERSON;
        const linkedParticipant = new LinkedParticipantResponse();
        linkedParticipant.link_type = LinkType.Interpreter;
        component.participant.linked_participants = [linkedParticipant];
        expect(component.canStartJoinConsultation).toBeFalsy();
    });

    it('should return false/true if the participant is a quick link observer/participant - canStartJoinConsultation', () => {
        [
            [Role.QuickLinkObserver, false],
            [Role.QuickLinkParticipant, true]
        ].forEach(([role, expected]) => {
            component.participant.role = role as Role;
            component.participant.linked_participants = [];
            expect(component.canStartJoinConsultation).toBe(expected as boolean);
        });
    });

    it('should return false if the participant is a victim - canStartJoinConsultation', () => {
        component.participant.hearing_role = HearingRole.VICTIM;
        component.participant.linked_participants = [];
        expect(component.canStartJoinConsultation).toBeFalsy();
    });

    it('should return false if the participant is police - canStartJoinConsultation', () => {
        component.participant.hearing_role = HearingRole.POLICE;
        component.participant.linked_participants = [];
        expect(component.canStartJoinConsultation).toBeFalsy();
    });

    it('should return if the participant is a witness or not - isWitness', () => {
        [
            [HearingRole.WINGER, false],
            [HearingRole.WINGER, false],
            [HearingRole.WITNESS, true],
            [HearingRole.OBSERVER, false],
            [HearingRole.JUDGE, false]
        ].forEach(([hearingRole, expected]) => {
            component.participant.hearing_role = hearingRole as HearingRole;
            expect(component.isOrHasWitnessLink()).toBe(expected as boolean);
        });
    });

    it('should return false when the participant is null - isWitness', () => {
        component.participant = null;

        expect(component.isOrHasWitnessLink()).toBeFalsy();
    });

    it('should return if the participant is a witness or not - isObserver', () => {
        [
            [HearingRole.WINGER, false],
            [HearingRole.WINGER, false],
            [HearingRole.WITNESS, false],
            [HearingRole.JUDGE, false],
            [HearingRole.OBSERVER, true]
        ].forEach(([hearingRole, expected]) => {
            component.participant.hearing_role = hearingRole as HearingRole;
            expect(component.isObserver).toBe(expected as boolean);
        });
    });

    it('should return false when the participant is null - isObserver', () => {
        component.participant = null;

        expect(component.isObserver).toBeFalsy();
    });
    it('should return if the participant is a quick link observer or not - isQuickLinkObserver', () => {
        [
            [Role.QuickLinkObserver, true],
            [Role.Individual, false]
        ].forEach(([role, expected]) => {
            component.participant.role = role as Role;
            expect(component.isQuickLinkObserver).toBe(expected as boolean);
        });
    });
    it('should show extra content when not showing video and witness is not being transferred in', () => {
        component.isTransferringIn = false;
        component.showVideo = false;

        expect(component.showExtraContent).toBeTruthy();
    });
    it('should not show extra content when we are showing video and witness is not being transferred in', () => {
        component.isTransferringIn = false;
        component.showVideo = true;

        expect(component.showExtraContent).toBeFalsy();
    });
    it('should not show extra content when we are not showing video and witness is being transferred in', () => {
        component.isTransferringIn = true;
        component.showVideo = false;

        expect(component.showExtraContent).toBeFalsy();
    });
    it('should not show extra content when we are showing video and witness is being transferred in', () => {
        component.isTransferringIn = true;
        component.showVideo = true;

        expect(component.showExtraContent).toBeFalsy();
    });
    it('should set hearing start announce  when hearing is about to start', fakeAsync(() => {
        component.announceHearingIsAboutToStart();
        flushMicrotasks();
        expect(component.hearingStartingAnnounced).toBeTruthy();
    }));
    it('should return "Meeting room" from getRoomName when room label is null', () => {
        // Arrange
        component.participant = null;

        // Act
        const roomName = component.getRoomName();

        // Assert
        expect(roomName).toBeUndefined();
        expect(consultationService.consultationNameToString).toHaveBeenCalledWith(undefined, false);
    });
    it('should set consultation modal when start is called', () => {
        component.openStartConsultationModal();
        expect(component.displayStartPrivateConsultationModal).toBeTruthy();
    });
    it('should set consultation modal visibility when join is called', () => {
        component.openJoinConsultationModal();
        expect(component.displayJoinPrivateConsultationModal).toBeTruthy();
    });
    it('should return non judge, staff member and joh participants from getPrivateConsultationParticipants', () => {
        const joh = new ParticipantResponse();
        joh.role = Role.JudicialOfficeHolder;
        const judge = new ParticipantResponse();
        judge.role = Role.Judge;
        const staff = new ParticipantResponse();
        staff.role = Role.StaffMember;
        const representative = new ParticipantResponse();
        representative.hearing_role = HearingRole.REPRESENTATIVE;
        component.conference.participants = [judge, judge, representative, representative, representative, joh, joh, joh, staff];
        expect(component.getPrivateConsultationParticipants().length).toBe(3);
    });
    it('should return non observer and witness participants from getPrivateConsultationParticipants', () => {
        const witness = new ParticipantResponse();
        witness.hearing_role = HearingRole.WITNESS;
        const observer = new ParticipantResponse();
        observer.hearing_role = HearingRole.OBSERVER;
        const representative = new ParticipantResponse();
        representative.hearing_role = HearingRole.REPRESENTATIVE;
        component.conference.participants = [witness, witness, observer, observer, representative, representative, representative];
        expect(component.getPrivateConsultationParticipants().length).toBe(3);
    });
    it('should not return current participant from private consultation participants', () => {
        const thisParticipant = new ParticipantResponse();
        thisParticipant.id = 'guid';
        const otherParticipant = new ParticipantResponse();
        otherParticipant.id = 'other-guid';
        component.participant = thisParticipant;
        component.conference.participants = [thisParticipant, otherParticipant];
        expect(component.getPrivateConsultationParticipants().length).toBe(1);
    });
    it('should call consultation service when starting consultation', fakeAsync(() => {
        component.startPrivateConsultation(null, null);
        flushMicrotasks();
        expect(consultationService.createParticipantConsultationRoom).toHaveBeenCalledTimes(1);
    }));
    it('should call consultation service when locking room', fakeAsync(() => {
        component.participant.current_room.label = 'label';
        component.setRoomLock(true);
        flushMicrotasks();
        expect(consultationService.lockConsultation).toHaveBeenCalledTimes(1);
    }));
    it('should close start consultation modal when close is called', () => {
        component.closeStartPrivateConsultationModal();
        expect(component.displayStartPrivateConsultationModal).toBeFalsy();
    });
    it('should close join consultation modal when close is called', () => {
        component.closeStartPrivateConsultationModal();
        expect(component.displayJoinPrivateConsultationModal).toBeFalsy();
    });
    it('should start consultation and set accordion expand to false', async () => {
        component.participant = globalParticipant;
        component.conference = globalConference;
        component.privateConsultationAccordianExpanded = true;
        await component.startPrivateConsultation([globalParticipant.id], []);

        expect(component.privateConsultationAccordianExpanded).toBe(false);
    });
    it('should join consultation and set accordion expand to false', async () => {
        component.participant = globalParticipant;
        component.conference = globalConference;
        component.privateConsultationAccordianExpanded = true;
        await component.joinPrivateConsultation('room1');

        expect(component.privateConsultationAccordianExpanded).toBe(false);
    });
    it('should confirm that participant in the judge and joh consultation room', () => {
        component.participant = globalParticipant;
        component.participant.current_room.label = 'JudgeJOHConsutationRoom';

        expect(component.isJohRoom).toBe(true);
    });
    it('should confirm that participant not in the judge and joh consultation room', () => {
        component.participant = globalParticipant;
        component.participant.current_room.label = 'ParticipantConsutationRoom';

        expect(component.isJohRoom).toBe(false);
    });

    it('showRoomClosingToast() should clear all toasts when not in the consultation room', async () => {
        component.isPrivateConsultation = false;
        roomClosingToastrService.showRoomClosingAlert.calls.reset();
        roomClosingToastrService.clearToasts.calls.reset();
        const date = new Date();

        await component.showRoomClosingToast(date);

        expect(roomClosingToastrService.clearToasts).toHaveBeenCalled();
        expect(roomClosingToastrService.currentToast).toBeFalsy();
    });

    it('showRoomClosingToast() should show "room closing" toast when in the consultation room', async () => {
        component.isPrivateConsultation = true;
        roomClosingToastrService.showRoomClosingAlert.calls.reset();
        roomClosingToastrService.clearToasts.calls.reset();
        const date = new Date();

        await component.showRoomClosingToast(date);

        expect(roomClosingToastrService.showRoomClosingAlert).toHaveBeenCalledWith(component.hearing, date);
        expect(roomClosingToastrService.currentToast).toBeTruthy();
    });

    it('should return allowAudioOnlyToggle true', async () => {
        component.conference = globalConference;
        component.participant.status = ParticipantStatus.Available;
        expect(component.allowAudioOnlyToggle).toBeTrue();
    });
    describe('Construction', () => {
        it('should init hearing alert and subscribers', fakeAsync(() => {
            component.ngOnInit();
            flushMicrotasks();
            tick(100);
            expect(component.clockSubscription$).toBeDefined();
            expect(component.eventHubSubscription$).toBeDefined();
            expect(component.videoCallSubscription$).toBeDefined();
            expect(component.displayDeviceChangeModal).toBeFalsy();
            expect(notificationSoundsService.initHearingAlertSound).toHaveBeenCalled();
        }));

        it('should onShouldUnload', fakeAsync(() => {
            spyOn<any>(component, 'onShouldUnload').and.callThrough();
            component.ngOnInit();
            flushMicrotasks();
            tick(100);
            shouldUnloadSubject.next();
            flush();
            expect(component['onShouldUnload']).toHaveBeenCalled();
        }));

        it('should call onShouldReload', fakeAsync(() => {
            spyOn<any>(component, 'onShouldReload').and.callFake(() => {});
            component.ngOnInit();
            flushMicrotasks();
            tick(100);
            shouldReloadSubject.next();
            flush();
            expect(component['onShouldReload']).toHaveBeenCalled();
        }));
    });

    describe('canStartJoinConsultation', () => {
        it('returns false if the participant has Observer Case Type Group', () => {
            component.participant = new ParticipantResponse({
                case_type_group: CaseTypeGroup.OBSERVER,
                hearing_role: HearingRole.APPRAISER,
                linked_participants: []
            });

            expect(component.canStartJoinConsultation).toBeFalse();
        });
    });
});
