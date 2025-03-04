import { fakeAsync, flush, flushMicrotasks, tick } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { ActiveToast } from 'ngx-toastr';
import { of, Subject } from 'rxjs';
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
    hideComponentsService,
    initAllWRDependencies,
    logger,
    mockConferenceStore,
    notificationSoundsService,
    notificationToastrService,
    roomClosingToastrService,
    router,
    titleService,
    launchDarklyService,
    videoCallService,
    videoWebService
} from '../../waiting-room-shared/tests/waiting-room-base-setup';
import { ParticipantWaitingRoomComponent } from '../participant-waiting-room.component';
import { translateServiceSpy } from 'src/app/testing/mocks/mock-translation.service';
import { UnloadDetectorService } from 'src/app/services/unload-detector.service';
import { getSpiedPropertyGetter } from 'src/app/shared/jasmine-helpers/property-helpers';
import { createParticipantRemoteMuteStoreServiceSpy } from '../../services/mock-participant-remote-mute-store.service';
import { UserMediaService } from 'src/app/services/user-media.service';
import { FEATURE_FLAGS } from 'src/app/services/launch-darkly.service';
import { mapConferenceToVHConference, mapParticipantToVHParticipant } from '../../store/models/api-contract-to-state-model-mappers';
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
        launchDarklyService.getFlag.withArgs(FEATURE_FLAGS.instantMessaging, false).and.returnValue(of(true));
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
            userMediaServiceSpy,
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
        component.vhConference = mapConferenceToVHConference(conference);
        component.participant = participant;
        component.vhParticipant = component.vhConference.participants.find(x => x.id === participant.id);
        component.connected = true; // assume connected to pexip
        videoWebService.getConferenceById.calls.reset();
        clockService.getClock.calls.reset();
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
        it('should return true participant is available', () => {
            // arrange
            component.vhParticipant.status = ParticipantStatus.Available;

            // act
            const result = component.allowAudioOnlyToggle;

            // assert
            expect(result).toBeTrue();
        });

        it('should return false participant is is a consultation', () => {
            // arrange
            component.vhParticipant.status = ParticipantStatus.InConsultation;

            // act
            const result = component.allowAudioOnlyToggle;

            // assert
            expect(result).toBeFalse();
        });

        it('should return false participant is in a hearing', () => {
            // arrange
            component.vhParticipant.status = ParticipantStatus.InHearing;

            // act
            const result = component.allowAudioOnlyToggle;

            // assert
            expect(result).toBeFalse();
        });

        it('should return false if participant is not set', () => {
            // arrange
            component.vhParticipant = null;

            // act
            const result = component.allowAudioOnlyToggle;

            // assert
            expect(result).toBeFalse();
        });

        it('should return false if conference is not set', () => {
            // arrange
            component.vhConference = null;

            // act
            const result = component.allowAudioOnlyToggle;

            // assert
            expect(result).toBeFalse();
        });
    });

    describe('ngOnInit', () => {
        beforeEach(() => {
            spyOn(component.eventHubSubscription$, 'add').and.callThrough();
        });

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
            expect(component.showWarning).toBeFalse();
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

    it('should clear go to hearing list when conference is past closed time', () => {
        const conf = new ConferenceTestData().getConferenceDetailNow();
        const status = ConferenceStatus.Closed;
        const closedDateTime = new Date(new Date().toUTCString());
        closedDateTime.setUTCMinutes(closedDateTime.getUTCMinutes() - 120);
        conf.status = status;
        conf.closed_date_time = closedDateTime;
        component.hearing = new Hearing(conf);

        component.checkIfHearingIsClosed();

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

    describe('canStartJoinConsultation', () => {
        it('should return true if the participant is a representative', () => {
            component.vhParticipant.hearingRole = HearingRole.REPRESENTATIVE;
            component.vhParticipant.linkedParticipants = [];
            expect(component.canStartJoinConsultation).toBeTrue();
        });

        it('should return false if the participant is a witness', () => {
            component.vhParticipant.hearingRole = HearingRole.WITNESS;
            component.vhParticipant.linkedParticipants = [];
            expect(component.canStartJoinConsultation).toBeFalse();
        });

        it('should return false if the participant is an observer', () => {
            component.vhParticipant.hearingRole = HearingRole.OBSERVER;
            component.vhParticipant.linkedParticipants = [];
            expect(component.canStartJoinConsultation).toBeFalse();
        });

        it('should return false if the participant is a individual with interpreter', () => {
            component.vhParticipant.hearingRole = HearingRole.LITIGANT_IN_PERSON;
            component.vhParticipant.linkedParticipants = [{ linkedType: LinkType.Interpreter }];
            expect(component.canStartJoinConsultation).toBeFalse();
        });

        it('should return false if the participant is a QL observer', () => {
            component.vhParticipant.role = Role.QuickLinkObserver;
            component.vhParticipant.linkedParticipants = [];
            expect(component.canStartJoinConsultation).toBeFalse();
        });

        it('should return true if the participant is a QL participant', () => {
            component.vhParticipant.role = Role.QuickLinkParticipant;
            component.vhParticipant.linkedParticipants = [];
            expect(component.canStartJoinConsultation).toBeTrue();
        });

        it('should return false if the participant is a victim', () => {
            component.vhParticipant.hearingRole = HearingRole.VICTIM;
            component.vhParticipant.linkedParticipants = [];
            expect(component.canStartJoinConsultation).toBeFalsy();
        });

        it('should return false if the participant is police', () => {
            component.vhParticipant.hearingRole = HearingRole.POLICE;
            component.vhParticipant.linkedParticipants = [];
            expect(component.canStartJoinConsultation).toBeFalsy();
        });
    });

    describe('isWitness', () => {
        it('should return true if the participant is a witness', () => {
            component.vhParticipant.hearingRole = HearingRole.WITNESS;
            expect(component.isOrHasWitnessLink()).toBeTrue();
        });

        it('should return false if the participant is not a witness', () => {
            component.vhParticipant.hearingRole = HearingRole.OBSERVER;
            expect(component.isOrHasWitnessLink()).toBeFalse();
        });
    });

    describe('isObserver', () => {
        it('should return true if the participant is an observer', () => {
            component.vhParticipant.hearingRole = HearingRole.OBSERVER;
            expect(component.isObserver).toBeTrue();
        });

        it('should return false if the participant is not an observer', () => {
            component.vhParticipant.hearingRole = HearingRole.WINGER;
            expect(component.isObserver).toBeFalse();
        });
    });

    describe('isQuickLinkObserver', () => {
        it('should return true if the participant is a quick link observer', () => {
            component.vhParticipant.role = Role.QuickLinkObserver;
            expect(component.isQuickLinkObserver).toBeTrue();
        });

        it('should return false if the participant is not a quick link observer', () => {
            component.vhParticipant.role = Role.Individual;
            expect(component.isQuickLinkObserver).toBeFalse();
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
        component.vhParticipant = null;

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
        component.vhConference = mapConferenceToVHConference(component.conference);
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
        component.vhConference = mapConferenceToVHConference(component.conference);
        expect(component.getPrivateConsultationParticipants().length).toBe(3);
    });
    it('should not return current participant from private consultation participants', () => {
        const thisParticipant = new ParticipantResponse();
        thisParticipant.id = 'guid';
        const otherParticipant = new ParticipantResponse();
        otherParticipant.id = 'other-guid';
        component.participant = thisParticipant;
        component.conference.participants = [thisParticipant, otherParticipant];
        component.vhConference = mapConferenceToVHConference(component.conference);
        component.vhParticipant = component.vhConference.participants.find(x => x.id === thisParticipant.id);

        expect(component.getPrivateConsultationParticipants().length).toBe(1);
    });

    describe('getPrivateConsultationParticipants with screening', () => {
        it('should not return a participant B is current participant is on their protect from list', () => {
            const participant1 = new ParticipantResponse();
            participant1.id = 'participant1';
            participant1.external_reference_id = 'participantExternalRef1';
            participant1.protect_from = [];

            const participant2 = new ParticipantResponse();
            participant2.id = 'participant2';
            participant2.external_reference_id = 'participantExternalRef2';
            participant2.protect_from = ['participantExternalRef1'];

            component.participant = participant1;
            component.conference.participants = [participant1, participant2];
            component.vhConference = mapConferenceToVHConference(component.conference);
            component.vhParticipant = component.vhConference.participants.find(x => x.id === participant1.id);
            expect(component.getPrivateConsultationParticipants().length).toBe(0);
        });

        it('should not return a Participant B if Participant B is on current participant protectFrom list', () => {
            const participant1 = new ParticipantResponse();
            participant1.id = 'participant1';
            participant1.external_reference_id = 'participantExternalRef1';
            participant1.protect_from = ['participantExternalRef2'];

            const participant2 = new ParticipantResponse();
            participant2.id = 'participant2';
            participant2.external_reference_id = 'participantExternalRef2';
            participant2.protect_from = [];

            component.participant = participant1;
            component.conference.participants = [participant1, participant2];
            component.vhConference = mapConferenceToVHConference(component.conference);
            component.vhParticipant = component.vhConference.participants.find(x => x.id === participant1.id);
            expect(component.getPrivateConsultationParticipants().length).toBe(0);
        });
    });
    it('should call consultation service when starting consultation', fakeAsync(() => {
        component.startPrivateConsultation(null, null);
        flushMicrotasks();
        expect(consultationService.createParticipantConsultationRoom).toHaveBeenCalledTimes(1);
    }));
    it('should call consultation service when locking room', fakeAsync(() => {
        component.vhParticipant.room = { label: 'label', locked: false };
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
        component.vhParticipant = mapParticipantToVHParticipant(globalParticipant);
        component.vhParticipant.room = { label: 'JudgeJOHConsutationRoom', locked: false };

        expect(component.isJohRoom).toBe(true);
    });
    it('should confirm that participant not in the judge and joh consultation room', () => {
        component.vhParticipant = mapParticipantToVHParticipant(globalParticipant);
        component.vhParticipant.room = { label: 'ParticipantConsutationRoom', locked: false };

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

    describe('onLeaveHearingButtonClicked', () => {
        it('should display leave hearing popup', () => {
            component.displayLeaveHearingPopup = false;
            component.onLeaveHearingButtonClicked();
            expect(component.displayLeaveHearingPopup).toBeTrue();
        });
    });
});
