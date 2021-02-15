import { fakeAsync, flushMicrotasks, tick } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { ConferenceResponse, ConferenceStatus, LoggedParticipantResponse, ParticipantResponse } from 'src/app/services/clients/api-client';
import { Hearing } from 'src/app/shared/models/hearing';
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

    it('should return false when the participant is not a witness', () => {
        component.participant.hearing_role = HearingRole.WINGER;

        expect(component.isWitness).toBeFalsy();
    });
    it('should return true when the participant is a witness', () => {
        component.participant.hearing_role = HearingRole.WITNESS;

        expect(component.isWitness).toBeTruthy();
    });
    it('should return false when the participant is not a witness', () => {
        component.participant.hearing_role = HearingRole.JUDGE;

        expect(component.isWitness).toBeFalsy();
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
});
