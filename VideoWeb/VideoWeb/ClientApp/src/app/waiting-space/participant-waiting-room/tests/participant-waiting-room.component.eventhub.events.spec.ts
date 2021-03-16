import { fakeAsync, flushMicrotasks } from '@angular/core/testing';
import { Guid } from 'guid-typescript';
import { ConferenceResponse, ConferenceStatus, ParticipantResponse, Role } from 'src/app/services/clients/api-client';
import { ConferenceStatusMessage } from 'src/app/services/models/conference-status-message';
import { hearingStatusSubjectMock } from 'src/app/testing/mocks/mock-events-service';
import { Hearing } from '../../../shared/models/hearing';
import {
    activatedRoute,
    adalService,
    clockService,
    consultationService,
    deviceTypeService,
    errorService,
    eventsService,
    globalConference,
    globalParticipant,
    globalWitness,
    heartbeatModelMapper,
    initAllWRDependencies,
    logger,
    notificationSoundsService,
    notificationToastrService,
    roomClosingToastrService,
    router,
    userMediaService,
    userMediaStreamService,
    videoCallService,
    videoWebService
} from '../../waiting-room-shared/tests/waiting-room-base-setup';
import { ParticipantWaitingRoomComponent } from '../participant-waiting-room.component';
import { translateServiceSpy } from 'src/app/testing/mocks/mock-translation-service';
import { HearingRole } from '../../models/hearing-role-model';

describe('ParticipantWaitingRoomComponent event hub events', () => {
    let component: ParticipantWaitingRoomComponent;
    const hearingStatusSubject = hearingStatusSubjectMock;
    const translateService = translateServiceSpy;

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
            roomClosingToastrService,
            clockService,
            translateService
        );
        adalService.userInfo.userName = 'chris.green@hearings.net';

        const conference = new ConferenceResponse(Object.assign({}, globalConference));
        const participant = new ParticipantResponse(Object.assign({}, globalParticipant));
        component.hearing = new Hearing(conference);
        component.conference = conference;
        component.participant = participant;
        component.connected = true; // assume connected to pexip
        component.startEventHubSubscribers();
        videoWebService.getConferenceById.calls.reset();
        consultationService.leaveConsultation.calls.reset();
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
        notificationSoundsService.playHearingAlertSound.calls.reset();

        component.displayDeviceChangeModal = true;

        hearingStatusSubject.next(message);
        flushMicrotasks();

        expect(component.displayDeviceChangeModal).toBeFalsy();
        expect(notificationSoundsService.playHearingAlertSound).toHaveBeenCalled();
    }));

    it('should move witness to waiting room when "in session" message received', fakeAsync(() => {
        const status = ConferenceStatus.InSession;
        const message = new ConferenceStatusMessage(globalConference.id, status);
        component.participant.hearing_role = HearingRole.WITNESS;
        hearingStatusSubject.next(message);
        flushMicrotasks();
        expect(consultationService.leaveConsultation).toHaveBeenCalled();
    }));

    it('should not move witness to waiting room when "not started" message received', fakeAsync(() => {
        const status = ConferenceStatus.NotStarted;
        const message = new ConferenceStatusMessage(globalConference.id, status);
        component.participant.hearing_role = HearingRole.WITNESS;
        hearingStatusSubject.next(message);
        flushMicrotasks();
        expect(consultationService.leaveConsultation).toHaveBeenCalledTimes(0);
    }));

    it('should not move non witness to waiting room when "in session" message received', fakeAsync(() => {
        const status = ConferenceStatus.InSession;
        const message = new ConferenceStatusMessage(globalConference.id, status);
        component.participant.hearing_role = HearingRole.JUDGE;
        hearingStatusSubject.next(message);
        flushMicrotasks();
        expect(consultationService.leaveConsultation).toHaveBeenCalledTimes(0);
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
        adalService.userInfo.userName = 'chris.green@hearings.net';
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
