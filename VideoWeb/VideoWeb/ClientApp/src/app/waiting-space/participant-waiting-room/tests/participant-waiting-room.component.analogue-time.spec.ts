import { ConferenceStatus } from 'src/app/services/clients/api-client';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { Hearing } from '../../../shared/models/hearing';
import { HearingRole } from '../../models/hearing-role-model';
import {
    activatedRoute,
    adalService,
    clockService,
    consultationService,
    deviceTypeService,
    errorService,
    eventsService,
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

describe('ParticipantWaitingRoomComponent message and clock', () => {
    let component: ParticipantWaitingRoomComponent;

    beforeAll(() => {
        initAllWRDependencies();
    });

    beforeEach(() => {
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
    });

    it('should return delayed class when conference is suspended', () => {
        const conference = new ConferenceTestData().getConferenceDetailNow();
        component.hearing = new Hearing(conference);
        component.hearing.getConference().status = ConferenceStatus.Suspended;
        component.participant = conference.participants[0];
        expect(component.getCurrentTimeClass()).toBe('hearing-delayed');
    });

    it('should return delayed class when conference is delayed', () => {
        const conference = new ConferenceTestData().getConferenceDetailPast();
        conference.status = ConferenceStatus.NotStarted;
        component.hearing = new Hearing(conference);
        component.participant = conference.participants[0];
        expect(component.getCurrentTimeClass()).toBe('hearing-delayed');
    });

    it('should return hearing-near-start class when conference is due to begin', () => {
        const conference = new ConferenceTestData().getConferenceDetailNow();
        component.hearing = new Hearing(conference);
        component.participant = conference.participants[0];
        expect(component.getCurrentTimeClass()).toBe('hearing-near-start');
    });

    it('should return hearing-on-time class when conference has not started and on time', () => {
        const conference = new ConferenceTestData().getConferenceDetailFuture();
        component.hearing = new Hearing(conference);
        component.participant = conference.participants[0];
        expect(component.getCurrentTimeClass()).toBe('hearing-on-time');
    });

    it('should return hearing-on-time class when conference has paused', () => {
        const conference = new ConferenceTestData().getConferenceDetailPast();
        conference.status = ConferenceStatus.Paused;
        component.hearing = new Hearing(conference);
        component.participant = conference.participants[0];
        expect(component.getCurrentTimeClass()).toBe('hearing-on-time');
    });

    it('should return hearing-on-time class when conference has closed', () => {
        const conference = new ConferenceTestData().getConferenceDetailPast();
        conference.status = ConferenceStatus.Closed;
        component.hearing = new Hearing(conference);
        component.participant = conference.participants[0];
        expect(component.getCurrentTimeClass()).toBe('hearing-on-time');
    });

    it('should return hearing-near-start class when conference is in session and user is a witness', () => {
        const conference = new ConferenceTestData().getConferenceDetailPast();
        conference.status = ConferenceStatus.InSession;
        component.hearing = new Hearing(conference);
        component.participant = conference.participants[0];
        component.participant.hearing_role = HearingRole.WITNESS;

        expect(component.getCurrentTimeClass()).toBe('hearing-near-start');
    });
    it('should return hearing-on-time as default for a witness', () => {
        const conference = new ConferenceTestData().getConferenceDetailPast();
        conference.status = ConferenceStatus.NotStarted;
        component.hearing = new Hearing(conference);
        component.participant = conference.participants[0];
        component.participant.hearing_role = HearingRole.WITNESS;

        expect(component.getCurrentTimeClass()).toBe('hearing-on-time');
    });
});
