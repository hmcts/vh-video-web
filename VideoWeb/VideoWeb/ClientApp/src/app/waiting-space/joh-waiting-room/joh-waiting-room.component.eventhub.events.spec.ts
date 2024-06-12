import { fakeAsync, flush } from '@angular/core/testing';
import { Guid } from 'guid-typescript';
import { ConferenceResponse, ConferenceStatus, ParticipantResponse } from 'src/app/services/clients/api-client';
import { ConferenceStatusMessage } from 'src/app/services/models/conference-status-message';
import { Hearing } from 'src/app/shared/models/hearing';
import { hearingStatusSubjectMock } from 'src/app/testing/mocks/mock-events-service';
import {
    activatedRoute,
    clockService,
    consultationInvitiationService,
    consultationService,
    deviceTypeService,
    errorService,
    eventsService,
    focusService,
    globalConference,
    globalJudge,
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
} from '../waiting-room-shared/tests/waiting-room-base-setup';
import { JohWaitingRoomComponent } from './joh-waiting-room.component';
import { translateServiceSpy } from 'src/app/testing/mocks/mock-translation.service';
import { UnloadDetectorService } from 'src/app/services/unload-detector.service';
import { Subject } from 'rxjs';
import { getSpiedPropertyGetter } from 'src/app/shared/jasmine-helpers/property-helpers';
import { createParticipantRemoteMuteStoreServiceSpy } from '../services/mock-participant-remote-mute-store.service';
import { RoomTransfer } from '../../shared/models/room-transfer';

describe('JohWaitingRoomComponent eventhub events', () => {
    let component: JohWaitingRoomComponent;
    let unloadDetectorServiceSpy: jasmine.SpyObj<UnloadDetectorService>;
    let shouldUnloadSubject: Subject<void>;
    let participantRemoteMuteStoreServiceSpy = createParticipantRemoteMuteStoreServiceSpy();

    const hearingStatusSubject = hearingStatusSubjectMock;
    const translateService = translateServiceSpy;

    beforeAll(() => {
        initAllWRDependencies();
    });

    beforeEach(async () => {
        unloadDetectorServiceSpy = jasmine.createSpyObj<UnloadDetectorService>('UnloadDetectorService', [], ['shouldUnload']);
        shouldUnloadSubject = new Subject<void>();
        getSpiedPropertyGetter(unloadDetectorServiceSpy, 'shouldUnload').and.returnValue(shouldUnloadSubject.asObservable());

        participantRemoteMuteStoreServiceSpy = createParticipantRemoteMuteStoreServiceSpy();

        component = new JohWaitingRoomComponent(
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
        component.startEventHubSubscribers();
        videoWebService.getConferenceById.calls.reset();
    });

    afterEach(() => {
        component.ngOnDestroy();
    });

    afterAll(() => {
        mockConferenceStore.resetSelectors();
    });

    it('should play hearing starting sound when "in session" message received', fakeAsync(() => {
        const status = ConferenceStatus.InSession;
        const message = new ConferenceStatusMessage(globalConference.id, status);
        notificationSoundsService.playHearingAlertSound.calls.reset();
        hearingStatusSubject.next(message);
        flush();

        expect(notificationSoundsService.playHearingAlertSound).toHaveBeenCalled();
    }));

    it('should stop hearing starting sound when conference status message received is not "in session"', fakeAsync(() => {
        const status = ConferenceStatus.Paused;
        const message = new ConferenceStatusMessage(globalConference.id, status);
        notificationSoundsService.stopHearingAlertSound.calls.reset();

        hearingStatusSubject.next(message);
        flush();

        expect(notificationSoundsService.stopHearingAlertSound).toHaveBeenCalled();
    }));

    it('should ignore hearing message received for other conferences', fakeAsync(() => {
        const status = ConferenceStatus.InSession;
        const message = new ConferenceStatusMessage(Guid.create().toString(), status);
        notificationSoundsService.playHearingAlertSound.calls.reset();

        hearingStatusSubject.next(message);
        flush();

        expect(notificationSoundsService.playHearingAlertSound).toHaveBeenCalledTimes(0);
    }));
});
