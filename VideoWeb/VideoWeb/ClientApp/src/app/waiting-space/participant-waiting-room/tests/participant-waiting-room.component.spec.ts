import { fakeAsync, flushMicrotasks, tick } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { Subscription } from 'rxjs';
import {
    ConferenceResponse,
    ConferenceStatus,
    LoggedParticipantResponse,
    ParticipantResponse,
    Role,
    RoomSummaryResponse
} from 'src/app/services/clients/api-client';
import { Hearing } from 'src/app/shared/models/hearing';
import { pageUrls } from 'src/app/shared/page-url.constants';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { HearingRole } from '../../models/hearing-role-model';
import { VideoCallPreferences } from '../../services/video-call-preferences.mode';
import {
    adalService,
    clockService,
    consultationService,
    deviceTypeService,
    errorService,
    eventsService,
    globalConference,
    globalParticipant,
    heartbeatModelMapper,
    initAllWRDependencies,
    logger,
    notificationSoundsService,
    notificationToastrService,
    router,
    userMediaService,
    userMediaStreamService,
    videoCallService,
    videoWebService
} from '../../waiting-room-shared/tests/waiting-room-base-setup';
import { ParticipantWaitingRoomComponent } from '../participant-waiting-room.component';

describe('ParticipantWaitingRoomComponent when conference exists', () => {
    let component: ParticipantWaitingRoomComponent;
    const conferenceTestData = new ConferenceTestData();
    let logged: LoggedParticipantResponse;
    let activatedRoute: ActivatedRoute;
    beforeAll(() => {
        initAllWRDependencies();

        const preferences = new VideoCallPreferences();
        preferences.audioOnly = false;
        videoCallService.retrieveVideoCallPreferences.and.returnValue(preferences);
    });

    beforeEach(() => {
        logged = new LoggedParticipantResponse({
            participant_id: globalParticipant.id,
            display_name: globalParticipant.display_name,
            role: globalParticipant.role
        });
        activatedRoute = <any>{
            snapshot: { data: { loggedUser: logged }, paramMap: convertToParamMap({ conferenceId: globalConference.id }) }
        };

        component = new ParticipantWaitingRoomComponent(
            activatedRoute,
            videoWebService,
            eventsService,
            adalService,
            logger,
            errorService,
            heartbeatModelMapper,
            videoCallService,
            deviceTypeService,
            router,
            consultationService,
            userMediaService,
            userMediaStreamService,
            notificationSoundsService,
            notificationToastrService,
            clockService
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
        closedDateTime.setUTCMinutes(closedDateTime.getUTCMinutes() - 30);
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
        { conference: conferenceTestData.getConferenceDetailNow(), status: ConferenceStatus.NotStarted, expected: 'is about to begin' },
        { conference: conferenceTestData.getConferenceDetailPast(), status: ConferenceStatus.NotStarted, expected: 'is delayed' },
        { conference: conferenceTestData.getConferenceDetailPast(), status: ConferenceStatus.InSession, expected: 'is in session' },
        { conference: conferenceTestData.getConferenceDetailPast(), status: ConferenceStatus.Paused, expected: 'is paused' },
        { conference: conferenceTestData.getConferenceDetailPast(), status: ConferenceStatus.Suspended, expected: 'is suspended' },
        { conference: conferenceTestData.getConferenceDetailPast(), status: ConferenceStatus.Closed, expected: 'is closed' }
    ];

    getConferenceStatusTextTestCases.forEach(test => {
        it(`should return hearing status text '${test.expected}'`, () => {
            component.hearing = new Hearing(test.conference);
            component.hearing.getConference().status = test.status;
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
            expect(component.canStartJoinConsultation).toBe(expected as boolean);
        });
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
            expect(component.isWitness).toBe(expected as boolean);
        });
    });

    it('should return false when the participant is null - isWitness', () => {
        component.participant = null;

        expect(component.isWitness).toBeFalsy();
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
        component.participant = null;
        expect(component.getRoomName()).toEqual('Meeting room');
    });
    it('should set consultation modal when start is called', () => {
        component.openStartConsultationModal();
        expect(component.displayStartPrivateConsultationModal).toBeTruthy();
    });
    it('should set consultation modal visibility when join is called', () => {
        component.openJoinConsultationModal();
        expect(component.displayJoinPrivateConsultationModal).toBeTruthy();
    });
    it('should return non judge and joh participants from getPrivateConsultationParticipants', () => {
        const joh = new ParticipantResponse();
        joh.role = Role.JudicialOfficeHolder;
        const judge = new ParticipantResponse();
        judge.role = Role.Judge;
        const representative = new ParticipantResponse();
        representative.hearing_role = HearingRole.REPRESENTATIVE;
        component.conference.participants = [judge, judge, representative, representative, representative, joh, joh, joh];
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
});
