import { fakeAsync, flushMicrotasks } from '@angular/core/testing';
import { Guid } from 'guid-typescript';
import { ConferenceResponse, ConferenceStatus, ParticipantResponse } from 'src/app/services/clients/api-client';
import { ConferenceStatusMessage } from 'src/app/services/models/conference-status-message';
import { hearingStatusSubjectMock } from 'src/app/testing/mocks/mock-events-service';
import { Hearing } from '../../../shared/models/hearing';
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
    globalParticipant,
    globalWitness,
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
} from '../../waiting-room-shared/tests/waiting-room-base-setup';
import { ParticipantWaitingRoomComponent } from '../participant-waiting-room.component';
import { translateServiceSpy } from 'src/app/testing/mocks/mock-translation.service';
import { UnloadDetectorService } from 'src/app/services/unload-detector.service';
import { of, Subject } from 'rxjs';
import { getSpiedPropertyGetter } from 'src/app/shared/jasmine-helpers/property-helpers';
import { createParticipantRemoteMuteStoreServiceSpy } from '../../services/mock-participant-remote-mute-store.service';
import { UserMediaService } from 'src/app/services/user-media.service';
import { FEATURE_FLAGS } from 'src/app/services/launch-darkly.service';

describe('ParticipantWaitingRoomComponent event hub events', () => {
    let component: ParticipantWaitingRoomComponent;
    const hearingStatusSubject = hearingStatusSubjectMock;
    const translateService = translateServiceSpy;
    let unloadDetectorServiceSpy: jasmine.SpyObj<UnloadDetectorService>;
    let userMediaServiceSpy: jasmine.SpyObj<UserMediaService>;
    let shouldUnloadSubject: Subject<void>;
    let participantRemoteMuteStoreServiceSpy = createParticipantRemoteMuteStoreServiceSpy();

    beforeAll(() => {
        initAllWRDependencies();
    });

    afterAll(() => {
        mockConferenceStore.resetSelectors();
    });

    beforeEach(() => {
        launchDarklyService.getFlag.withArgs(FEATURE_FLAGS.vodafone, false).and.returnValue(of(false));
        launchDarklyService.getFlag.withArgs(FEATURE_FLAGS.instantMessaging, false).and.returnValue(of(true));
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
            launchDarklyService,
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
        component.eventHubSubscription$.unsubscribe();
        if (component.callbackTimeout) {
            clearTimeout(component.callbackTimeout);
        }
    });

    it('should play hearing starting sound when "in session" message received and participant is not a witness', fakeAsync(() => {
        const status = ConferenceStatus.InSession;
        const message = new ConferenceStatusMessage(globalConference.id, status);
        component.conferenceStartedBy = component.participant.id;
        notificationSoundsService.playHearingAlertSound.calls.reset();

        component.displayDeviceChangeModal = true;

        hearingStatusSubject.next(message);
        flushMicrotasks();

        expect(component.displayDeviceChangeModal).toBeFalsy();
        expect(notificationSoundsService.playHearingAlertSound).toHaveBeenCalled();
    }));

    it('should ignore hearing message received for other conferences', fakeAsync(() => {
        const status = ConferenceStatus.InSession;
        const message = new ConferenceStatusMessage(Guid.create().toString(), status);
        notificationSoundsService.playHearingAlertSound.calls.reset();

        hearingStatusSubject.next(message);
        flushMicrotasks();

        expect(notificationSoundsService.playHearingAlertSound).toHaveBeenCalledTimes(0);
    }));

    it('should not play hearing starting sound when "in session" message received and participant is a witness', fakeAsync(() => {
        component.participant = globalWitness;
        const status = ConferenceStatus.InSession;
        component.displayDeviceChangeModal = true;
        const message = new ConferenceStatusMessage(globalConference.id, status);
        notificationSoundsService.playHearingAlertSound.calls.reset();

        hearingStatusSubject.next(message);
        flushMicrotasks();

        expect(notificationSoundsService.playHearingAlertSound).toHaveBeenCalledTimes(0);
        expect(component.displayDeviceChangeModal).toBeTruthy();
    }));
});
