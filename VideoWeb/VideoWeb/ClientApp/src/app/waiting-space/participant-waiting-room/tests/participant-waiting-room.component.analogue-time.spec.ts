import { ConferenceStatus } from 'src/app/services/clients/api-client';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { Hearing } from '../../../shared/models/hearing';
import { HearingRole } from '../../models/hearing-role-model';
import {
    activatedRoute,
    clockService,
    consultationInvitiationService,
    consultationService,
    deviceTypeService,
    errorService,
    eventsService,
    focusService,
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
import { Subject } from 'rxjs';
import { getSpiedPropertyGetter } from 'src/app/shared/jasmine-helpers/property-helpers';
import { createParticipantRemoteMuteStoreServiceSpy } from '../../services/mock-participant-remote-mute-store.service';
import { UserMediaService } from 'src/app/services/user-media.service';

describe('ParticipantWaitingRoomComponent message and clock', () => {
    let component: ParticipantWaitingRoomComponent;
    const translateService = translateServiceSpy;
    let unloadDetectorServiceSpy: jasmine.SpyObj<UnloadDetectorService>;
    let userMediaServiceSpy: jasmine.SpyObj<UserMediaService>;
    let shouldUnloadSubject: Subject<void>;
    let participantRemoteMuteStoreServiceSpy = createParticipantRemoteMuteStoreServiceSpy();

    beforeAll(() => {
        initAllWRDependencies();
    });

    beforeEach(() => {
        unloadDetectorServiceSpy = jasmine.createSpyObj<UnloadDetectorService>('UnloadDetectorService', [], ['shouldUnload']);
        userMediaServiceSpy = jasmine.createSpyObj<UserMediaService>('UserMediaService', [], ['isAudioOnly$']);
        shouldUnloadSubject = new Subject<void>();
        getSpiedPropertyGetter(unloadDetectorServiceSpy, 'shouldUnload').and.returnValue(shouldUnloadSubject.asObservable());

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
